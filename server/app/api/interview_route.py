import logging

from fastapi import APIRouter, UploadFile, Depends

from app.utils.auth import get_current_user
from app.controllers.interview_controller import start_session_handler,start_code_session_handler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/interview", tags=["Interviews"])


@router.post("/start")
async def start_session(pdf: UploadFile, user_id: str = Depends(get_current_user)):
    """
    Starts a new interview session for the authenticated user.
    A PDF with context (like a job description or resume) can be uploaded.
    """
    return await start_session_handler(pdf, user_id)


@router.post("/code_start")
async def start_session(pdf: UploadFile, user_id: str = Depends(get_current_user)):
    """
    Starts a new interview session for the authenticated user.
    A PDF with context (like a job description or resume) can be uploaded.
    """
    return await start_code_session_handler(pdf, user_id)
