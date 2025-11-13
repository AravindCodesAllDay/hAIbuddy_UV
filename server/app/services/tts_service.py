import asyncio
import base64
import io
import re
import soundfile as sf
import logging
from app.services.init_services import ServiceContainer
from app.core.settings import settings

logger = logging.getLogger(__name__)


async def generate_tts(sentence: str) -> str:
    """
    Generate a base64-encoded WAV audio string for a given sentence
    using a specific speaker_id.
    """
    try:
        # Clean text of markdown or other special chars for better TTS
        clean_text = re.sub(r'[#*_]', '', sentence).strip()
        if not clean_text:
            logger.debug("Skipping TTS for empty cleaned text.")
            return ""

        loop = asyncio.get_event_loop()

        # Run the blocking TTS generation in a separate thread pool
        wav = await loop.run_in_executor(
            None,  # Use default ThreadPoolExecutor
            lambda: ServiceContainer.tts().tts(
                text=clean_text,
                speaker=settings.TTS_SPEAKER  # Pass the speaker_id
            )
        )

        # In-memory buffer to hold the WAV file
        buffer = io.BytesIO()
        sf.write(buffer, wav, samplerate=ServiceContainer.tts().synthesizer.output_sample_rate, format='WAV')
        buffer.seek(0)

        # Encode as base64 and return as a string
        return base64.b64encode(buffer.read()).decode("utf-8")
    except Exception as e:
        logger.error(f"TTS generation failed: {e}")
        return ""
