import asyncio
import base64
import json
import logging
from datetime import datetime, UTC
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from bson import ObjectId
from app.database.connection import mongodb
from app.utils.auth import decode_access_token
from app.services.stt_service import stream_transcribe
from app.services.tts_service import generate_tts
from app.services.llm_service import stream_llm_response
from app.utils.prompts import interview_system_prompt, IDLE_NUDGE_PROMPTS
from app.core.settings import settings

router = APIRouter(prefix="/interview", tags=["Interviews"])

logger = logging.getLogger(__name__)


class InterviewConnectionManager:
    """Manages a single WebSocket interview session."""

    def __init__(self, websocket: WebSocket, session_id: str, user_id: str):
        self.websocket = websocket
        self.session_id = ObjectId(session_id)
        self.user_id = ObjectId(user_id)

        self.session = None
        self.chat_history = []
        self.active_llm_task: asyncio.Task | None = None
        self.timer_task: asyncio.Task | None = None
        self.remaining_time = settings.SESSION_DURATION
        self.idle_count = 0
        self.stt_stream_task: asyncio.Task | None = None
        self.stt_stream_queue: asyncio.Queue | None = None

    async def _authenticate_and_validate(self) -> bool:
        """Fetch and validate the user's session."""
        try:
            self.session = await mongodb.interviews_collection.find_one({
                "_id": self.session_id,
                "user_id": self.user_id
            })
            if not self.session:
                await self.send_error("Session not found.")
                return False

            if self.session.get("status") == "completed":
                await self.send_error("Session already completed.")
                return False

            return True
        except Exception as e:
            logger.error(f"Error fetching session {self.session_id}: {e}")
            await self.send_error("Database error.")
            return False

    async def _initialize_timer(self):
        """Start the session timer and calculate remaining time."""
        started_at = self.session.get("started_at")

        if not started_at:
            # First connection - initialize timer
            started_at = datetime.now(UTC)
            await mongodb.interviews_collection.update_one(
                {"_id": self.session_id},
                {"$set": {"started_at": started_at}}
            )

        # --- THIS IS THE FIX ---
        # If the loaded datetime is naive (tzinfo is None),
        # assume it's UTC and make it aware.
        if started_at.tzinfo is None:
            logger.warning(f"Session {self.session_id} has a naive 'started_at' datetime. Localizing to UTC.")
            started_at = started_at.replace(tzinfo=UTC)
        # --- END OF FIX ---

        # Now this subtraction will always work
        elapsed = (datetime.now(UTC) - started_at).total_seconds()
        self.remaining_time = max(0, settings.SESSION_DURATION - elapsed)

        logger.info(f"Session {self.session_id} - Elapsed: {elapsed:.0f}s, Remaining: {self.remaining_time:.0f}s")

        await self.send_json({
            "type": "timer_update",
            "remaining_seconds": int(self.remaining_time),
            "total_seconds": settings.SESSION_DURATION
        })

        if self.remaining_time < 60:
            logger.info(f"Session {self.session_id} has less than 1 minute remaining. Completing session.")
            # Use the class method to complete
            await self._complete_session("Session time has expired.")
            return False

        self.timer_task = asyncio.create_task(self._session_timer_task())
        return True

    async def _session_timer_task(self):
        """Background task to manage the timer and auto-complete."""
        try:
            while self.remaining_time > 0:
                await asyncio.sleep(10)
                self.remaining_time -= 10

                await self.send_json({
                    "type": "timer_update",
                    "remaining_seconds": int(max(0, self.remaining_time))
                })

                if 60 > self.remaining_time > 50:
                    await self.send_json({
                        "type": "timer_warning",
                        "message": "Less than 1 minute remaining..."
                    })

                if self.remaining_time <= 0:
                    await self._complete_session("Your session time has expired.")
                    break
        except asyncio.CancelledError:
            logger.info(f"Session timer cancelled for {self.session_id}")
        except Exception as exe:
            logger.error(f"Error in session timer {self.session_id}: {exe}")

    async def _complete_session(self, message: str):
        """Mark session as complete in DB and notify client."""
        logger.info(f"Completing session {self.session_id}: {message}")
        await mongodb.interviews_collection.update_one(
            {"_id": self.session_id},
            {"$set": {"status": "completed", "ended_at": datetime.now(UTC)}}
        )
        await self.send_json({
            "type": "session_complete",
            "message": message
        })
        await self.websocket.close()

    async def _setup_chat_history(self):
        """Load chat history from the session."""
        messages = self.session.get("messages", [])
        system_msg = {"role": "system",
                      "content": interview_system_prompt() + (self.session.get("resume_summary") or "")}
        self.chat_history = [system_msg] + messages

    async def _cancel_active_llm(self):
        """Cancel any in-progress LLM stream."""
        if self.active_llm_task and not self.active_llm_task.done():
            self.active_llm_task.cancel()
            logger.info("User interrupted LLM stream.")
            await self.send_json({"type": "cancelled"})

    async def _handle_stt_stream(self):
        """
        A background task that consumes audio from the queue and
        streams it to the STT service.
        """
        if not self.stt_stream_queue:
            return

        # 1. Create an async generator that the STT service can read from
        async def audio_chunk_generator():
            while True:
                chunk_base64 = await self.stt_stream_queue.get()
                if chunk_base64 is None:
                    # End signal
                    break
                yield base64.b64decode(chunk_base64)

        # 2. Call the streaming STT service
        try:
            # This API is hypothetical - replace with your actual STT service's API
            async for result in stream_transcribe(audio_chunk_generator()):
                if result.is_final:
                    # Final result - send the "transcription" message
                    await self.send_json({
                        "type": "transcription",
                        "user_text": result.text
                    })

                    # Now that we have the final text, send it to the LLM
                    self.chat_history.append({"role": "user", "content": result.text})
                    self.active_llm_task = asyncio.create_task(
                        stream_llm_response(self.websocket, self.chat_history)
                    )
                else:
                    # Interim result - send "partial_transcription"
                    await self.send_json({
                        "type": "partial_transcription",
                        "user_text": result.text
                    })

        except Exception as e:
            logger.error(f"STT Stream error for {self.session_id}: {e}")
            await self.send_error("Error during transcription.")
        finally:
            self.stt_stream_task = None
            self.stt_stream_queue = None

    async def handle_message(self, data: dict):
        """Handle incoming WebSocket messages."""
        msg_type = data.get("type")

        # --- THIS REPLACES "user_audio" ---
        if msg_type == "start_speech_stream":
            self.idle_count = 0
            await self._cancel_active_llm()

            # If a stream is already running, cancel it
            if self.stt_stream_task and not self.stt_stream_task.done():
                self.stt_stream_task.cancel()

            # Create a new queue and start the processing task
            self.stt_stream_queue = asyncio.Queue()
            self.stt_stream_task = asyncio.create_task(self._handle_stt_stream())

        elif msg_type == "audio_chunk":
            if self.stt_stream_queue:
                # Add the audio data (which is base64) to the queue
                await self.stt_stream_queue.put(data.get("audio"))

        elif msg_type == "end_speech_stream":
            if self.stt_stream_queue:
                # Send a 'None' to the queue to signal the end
                await self.stt_stream_queue.put(None)

        elif msg_type == "user_idle":
            self.idle_count += 1
            await self._cancel_active_llm()

            prompt_index = min(self.idle_count - 1, len(IDLE_NUDGE_PROMPTS) - 1)
            nudge_content = IDLE_NUDGE_PROMPTS[prompt_index]
            messages_for_nudge = self.chat_history + [{"role": "user", "content": nudge_content}]

            self.active_llm_task = asyncio.create_task(
                stream_llm_response(self.websocket, self.chat_history, messages_for_llm=messages_for_nudge)
            )

        elif msg_type == "tts_request":
            text, idx = data.get("sentence"), data.get("index")
            audio_base64 = await generate_tts(text)
            if audio_base64:
                await self.send_json({
                    "type": "tts_audio_chunk",
                    "audio": f"data:audio/wav;base64,{audio_base64}",
                    "index": idx
                })

    async def run(self):
        """Main connection loop."""
        await self.websocket.accept()

        if not await self._authenticate_and_validate():
            await self.websocket.close()
            return

        if not await self._initialize_timer():
            await self.websocket.close()
            return

        await self._setup_chat_history()

        try:
            while True:
                data = json.loads(await self.websocket.receive_text())
                await self.handle_message(data)

        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected for session {self.session_id}.")
            if self.chat_history and len(self.chat_history) > 1:
                await mongodb.interviews_collection.update_one(
                    {"_id": self.session_id},
                    {"$set": {"messages": self.chat_history[1:]}}  # Save messages
                )
        except Exception as e:
            logger.error(f"Unexpected error in {self.session_id}: {e}")
            await self.websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        finally:
            self.cleanup()

    def cleanup(self):
        """Cancel all running tasks."""
        if self.timer_task and not self.timer_task.done():
            self.timer_task.cancel()
        if self.active_llm_task and not self.active_llm_task.done():
            self.active_llm_task.cancel()
        if self.stt_stream_task and not self.stt_stream_task.done():
            self.stt_stream_task.cancel()
        logger.info(f"Cleaned up tasks for session {self.session_id}.")

    async def send_json(self, data: dict):
        """Helper to send JSON data."""
        await self.websocket.send_text(json.dumps(data))

    async def send_error(self, message: str):
        """Helper to send an error message."""
        await self.send_json({"type": "error", "message": message})


@router.websocket("/{session_id}/message/{token}")
async def websocket_interview(websocket: WebSocket, session_id: str, token: str):
    """
    Main websocket endpoint. Handles authentication and delegates to the
    Connection Manager.
    """
    payload = decode_access_token(token)
    user_id = payload.get("sub") if payload else None

    if not user_id:
        logger.warning("WebSocket connection attempt with invalid token.")
        await websocket.accept()  # Accept to send the error
        await websocket.send_text(json.dumps({"type": "error", "message": "Invalid token."}))
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Create a manager instance for this specific connection
    manager = InterviewConnectionManager(websocket, session_id, user_id)
    await manager.run()
