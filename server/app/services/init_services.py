import logging
from faster_whisper import WhisperModel
from TTS.api import TTS
import ollama
import io
import asyncio
from app.core.settings import settings

logger = logging.getLogger(__name__)


class ServiceContainer:
    """Lazy initialization and warm-up of AI services."""

    _whisper = None
    _tts = None
    _llm_client = None

    # -----------------------------
    # Lazy initializers
    # -----------------------------
    @classmethod
    def whisper(cls):
        if cls._whisper is None:
            logger.info(f"Loading Whisper model: {settings.WHISPER_MODEL}")
            cls._whisper = WhisperModel(
                settings.WHISPER_MODEL,
                device=settings.DEVICE,
                compute_type=settings.WHISPER_COMPUTE_TYPE,
            )
        return cls._whisper

    @classmethod
    def tts(cls):
        if cls._tts is None:
            logger.info(f"Loading TTS model: {settings.TTS_MODEL}, speaker: {settings.TTS_SPEAKER}")
            cls._tts = TTS(settings.TTS_MODEL).to(settings.DEVICE)
        return cls._tts

    @classmethod
    def llm(cls):
        if cls._llm_client is None:
            logger.info(f"Initializing Ollama client: {settings.OLLAMA_MODEL}")
            cls._llm_client = ollama.AsyncClient()
        return cls._llm_client

    # -----------------------------
    # Startup
    # -----------------------------
    @classmethod
    async def warm_up(cls):
        """Preload heavy models asynchronously."""
        loop = asyncio.get_event_loop()
        tasks = []

        if cls._whisper is None:
            tasks.append(loop.run_in_executor(None, cls.whisper))
        if cls._tts is None:
            tasks.append(loop.run_in_executor(None, cls.tts))
        if cls._llm_client is None:
            tasks.append(loop.run_in_executor(None, cls.llm))

        if tasks:
            await asyncio.gather(*tasks)
            logger.info("✅ All AI services warmed up and loaded into memory.")
        else:
            logger.info("✅ Services already loaded.")

    # -----------------------------
    # Keep-alive loop
    # -----------------------------
    @classmethod
    async def keep_alive(cls, interval_seconds: int = 300):
        """Keep models in GPU memory."""
        await cls.warm_up()
        logger.info("🕒 Starting AI services keep-alive loop.")
        while True:
            try:
                if cls._whisper:
                    # Use a small silent audio sample
                    with io.BytesIO(b"\x00" * 4000) as f:
                        _ = cls._whisper.transcribe(f)
                if cls._tts:
                    _ = cls._tts.tts(text="keep alive", speaker=settings.TTS_SPEAKER)
                await asyncio.sleep(interval_seconds)
            except Exception as e:
                logger.warning(f"Keep-alive ping failed: {e}")
                await asyncio.sleep(interval_seconds)

    # -----------------------------
    # Shutdown cleanup
    # -----------------------------
    @classmethod
    async def close_all(cls):
        """Gracefully close clients (if applicable)."""
        try:
            if cls._llm_client:
                await cls._llm_client.close()
        except Exception as e:
            logger.warning(f"Error while closing LLM client: {e}")
