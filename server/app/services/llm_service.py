import json
import logging
import asyncio
from fastapi import WebSocket
from app.services.init_services import ServiceContainer
from app.core.settings import settings
from ollama import AsyncClient
from app.utils.prompts import resume_summarizing_prompt

logger = logging.getLogger(__name__)


def get_ollama_options() -> dict:
    """Returns a dictionary of Ollama generation options from settings."""
    return {
        "temperature": settings.OLLAMA_TEMPERATURE,
        "top_k": settings.OLLAMA_TOP_K,
        "top_p": settings.OLLAMA_TOP_P,
        "num_ctx": settings.OLLAMA_NUM_CTX,
        "seed":settings.OLLAMA_SEED,
        "repeat_penalty":settings.OLLAMA_REPEAT_PENALITY
    }


# MODIFIED: Added 'messages_for_llm' parameter
async def stream_llm_response(
        websocket: WebSocket,
        chat_history: list[dict],
        messages_for_llm: list[dict] | None = None
):
    """
    Streams the LLM response.
    - chat_history: The official history, which gets *updated* with the response.
    - messages_for_llm: The *actual* prompt to send to the LLM. If None, defaults to chat_history.
    """
    full_response = ""
    client: AsyncClient = ServiceContainer.llm()

    # Use the override if provided, otherwise default to chat_history
    messages_to_send = messages_for_llm if messages_for_llm is not None else chat_history

    ollama_options = get_ollama_options()  # Retrieve Ollama options

    try:
        async for chunk in await client.chat(
                model=settings.OLLAMA_MODEL,
                messages=messages_to_send,
                stream=True,
                options=ollama_options  # Pass the options dictionary
        ):
            token = chunk["message"]["content"]
            if token:
                full_response += token
                await websocket.send_text(json.dumps({"type": "llm_token", "token": token}))
            await asyncio.sleep(0)  # Let cancellation propagate

        # IMPORTANT: We always append the *response* to the *main* chat_history
        chat_history.append({"role": "assistant", "content": full_response.strip()})
        await websocket.send_text(json.dumps({"type": "llm_end"}))

    except asyncio.CancelledError:
        logger.info("LLM stream cancelled by user interruption.")
        await websocket.send_text(json.dumps({"type": "cancelled"}))
        raise
    except Exception as e:
        logger.error(f"LLM stream error: {e}")
        await websocket.send_text(json.dumps({"type": "error", "message": "Language model error"}))


# ... (summarize_resume function remains unchanged) ...
async def summarize_resume(resume_text: str) -> str:
    """
    Uses the Ollama LLM to summarize and evaluate the candidate's resume.
    """
    if not resume_text.strip():
        return "No resume text provided."

    try:
        client: AsyncClient = ServiceContainer.llm()
        prompt = resume_summarizing_prompt()

        ollama_options = get_ollama_options()  # Retrieve Ollama options

        response = await client.chat(
            model=settings.OLLAMA_MODEL,
            messages=[{
                "role": "system",
                "content": prompt
            }, {
                "role": "user",
                "content": resume_text
            }],
            stream=False,
            options=ollama_options  # Pass the options dictionary
        )

        content = response.get("message", {}).get("content", "").strip()
        if not content:
            return "Summary generation failed."

        return content

    except Exception as e:
        logger.error(f"Error generating resume summary: {e}")
        return "Error generating summary."