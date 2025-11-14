import asyncio
import base64
import io
import logging
from typing import AsyncGenerator

from app.core.settings import settings
from app.services.init_services import ServiceContainer

logger = logging.getLogger(__name__)


class TranscriptionResult:
    """A simple data class to match the API expected by the backend."""

    def __init__(self, text: str, is_final: bool):
        self.text = text
        self.is_final = is_final


async def stream_transcribe(
        audio_chunk_generator: AsyncGenerator[bytes, None]
) -> AsyncGenerator[TranscriptionResult, None]:
    """
    Simple streaming approach: Show progressive "Recording..." status,
    then final transcription.

    This is more honest than fake partial results, and avoids
    the computational overhead of multiple Whisper calls.
    """
    logger.info("Starting STT stream...")

    full_audio_buffer = io.BytesIO()
    chunk_count = 0

    # Yield a "listening" partial result immediately
    yield TranscriptionResult(text="Listening...", is_final=False)

    try:
        async for chunk in audio_chunk_generator:
            if chunk is None:
                break

            full_audio_buffer.write(chunk)
            chunk_count += 1

            # Every few chunks, update the UI to show we're still receiving
            if chunk_count % 3 == 0:  # Every ~1.5 seconds
                yield TranscriptionResult(text="Processing audio...", is_final=False)

        logger.info("STT stream ended. Transcribing full buffer...")

        full_audio_bytes = full_audio_buffer.getvalue()

        if not full_audio_bytes:
            logger.info("No audio data received.")
            yield TranscriptionResult(text="", is_final=True)
            return

        # Transcribe the complete audio
        loop = asyncio.get_event_loop()
        audio_buffer_for_whisper = io.BytesIO(full_audio_bytes)

        segments, _ = await loop.run_in_executor(
            None,
            lambda: ServiceContainer.whisper().transcribe(
                audio_buffer_for_whisper,
                beam_size=settings.WHISPER_BEAM_SIZE
            )
        )

        final_text = " ".join(seg.text for seg in segments).strip()
        logger.info(f"Final transcription: {final_text}")

        yield TranscriptionResult(text=final_text, is_final=True)

    except Exception as e:
        logger.error(f"Streaming transcription error: {e}")
        yield TranscriptionResult(text="[Error]", is_final=True)
    finally:
        full_audio_buffer.close()


async def transcribe_audio(base64_audio: str) -> str:
    """
    Decode audio and transcribe it using Whisper.
    Original batch function for non-streaming use.
    """
    try:
        audio_data = base64.b64decode(base64_audio)
        audio_buffer = io.BytesIO(audio_data)
        loop = asyncio.get_event_loop()

        segments, _ = await loop.run_in_executor(
            None,
            lambda: ServiceContainer.whisper().transcribe(
                audio_buffer,
                beam_size=settings.WHISPER_BEAM_SIZE
            )
        )

        return " ".join(seg.text for seg in segments).strip()
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        return ""
