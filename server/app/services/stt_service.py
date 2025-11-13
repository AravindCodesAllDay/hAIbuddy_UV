import asyncio
import base64
import io
import logging

from app.core.settings import settings
from app.services.init_services import ServiceContainer

logger = logging.getLogger(__name__)


async def transcribe_audio(base64_audio: str) -> str:
    """
    Decode audio and transcribe it using Whisper.
    """
    try:
        # Decode the base64 string
        audio_data = base64.b64decode(base64_audio)
        audio_buffer = io.BytesIO(audio_data)
        loop = asyncio.get_event_loop()

        # Log the option being used for debugging
        logger.debug(f"Using beam_size from settings: {settings.WHISPER_BEAM_SIZE}")

        # Run the blocking transcribe function in a separate thread pool
        segments, _ = await loop.run_in_executor(
            None,  # Use default ThreadPoolExecutor
            lambda: ServiceContainer.whisper().transcribe(
                audio_buffer,
                beam_size=settings.WHISPER_BEAM_SIZE
            )
        )

        # Join all transcribed segments
        return " ".join(seg.text for seg in segments).strip()
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        return ""