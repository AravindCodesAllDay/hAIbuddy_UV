import logging
import os
import shutil
import tempfile
from bson import ObjectId
from PyPDF2 import PdfReader
from fastapi import UploadFile, HTTPException

from app.database.connection import mongodb
from app.models.interview_model import Interview
from app.services.llm_service import summarize_resume

logger = logging.getLogger(__name__)

interviews_collection = mongodb.interviews_collection


async def start_session_handler(pdf: UploadFile, user_id: str):
    """
    Starts a new interview session:
    1. Extracts text from uploaded resume PDF.
    2. Generates an AI summary for interview context.
    3. Saves resume text + summary in MongoDB.
    """

    pdf_text = ""
    pdf_path = None

    # --- Step 1: Extract text from PDF ---
    if pdf:
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
                shutil.copyfileobj(pdf.file, temp_pdf)
                pdf_path = temp_pdf.name

            with open(pdf_path, "rb") as file:
                reader = PdfReader(file)
                pdf_text = " ".join(
                    [page.extract_text() or "" for page in reader.pages]
                ).strip()

            if not pdf_text:
                raise ValueError("No readable text found in uploaded PDF.")

        except Exception as e:
            logger.error(f"PDF processing failed: {e}")
            raise HTTPException(
                status_code=500, detail=f"Error processing PDF: {str(e)}")
        finally:
            if pdf_path and os.path.exists(pdf_path):
                os.remove(pdf_path)

    # --- Step 2: Generate summary with LLM ---
    # try:
    #     resume_summary = await summarize_resume(pdf_text)
    # except Exception as e:
    #     logger.error(f"Resume summarization failed: {e}")
    #     raise HTTPException(
    #         status_code=500, detail="Failed to generate resume summary")

    # --- Step 3: Create Interview document ---
    new_interview = Interview(
        user_id=ObjectId(user_id),
        resume_summary=pdf_text,
    )

    # --- Step 4: Insert into DB ---
    result = await interviews_collection.insert_one(
        new_interview.model_dump(by_alias=True)
    )
    interview_id = result.inserted_id

    logger.info(f"✅ New interview started for user {user_id}: {interview_id}")

    return {
        "session_id": str(interview_id),
        "message": "Interview session initialized successfully."
    }
