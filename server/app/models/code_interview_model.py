from datetime import datetime, UTC
from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from bson import ObjectId


# Audio Analysis Data
class VoiceData(BaseModel):
    avg_pitch: float
    pitch_std: float
    energy: float
    speech_rate: float
    confidence: float


# Facial Emotion Analysis Data
class EmotionData(BaseModel):
    neutral: float
    happy: float
    sad: float
    angry: float
    fearful: float
    disgusted: float
    surprised: float


# Message Schema
class Message(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str
    face_data: Optional[EmotionData] = None
    voice_data: Optional[VoiceData] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ReportResult(BaseModel):
    overall_score: float  # 0 to 100
    summary: str  # A short textual summary of performance
    strengths: List[str]  # Detected strong points
    weaknesses: List[str]  # Detected weak points

    # Aggregated emotion analysis from facial data
    emotional_profile: Optional[EmotionData] = None

    # Aggregated voice features
    voice_metrics: Optional[VoiceData] = None

    # Derived metrics
    total_messages: int
    average_response_time_sec: float
    avg_words_per_response: float
    engagement_score: float  # Based on turn-taking, consistency, etc.

    # Optional LLM-driven analysis (for NLP/semantic scoring)
    clarity_score: float  # How clear were the responses?
    relevance_score: float  # How relevant were the answers?
    coherence_score: float  # Logical flow, consistency

    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))


class CodeInterview(BaseModel):
    user_id: ObjectId
    status: Literal["ongoing", "complete", "cancelled"] = Field(default="ongoing")
    messages: Optional[List["Message"]] = Field(default_factory=list)
    report: Optional["ReportResult"] = None
    started_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    ended_at: Optional[datetime] = None

    model_config = {
        "arbitrary_types_allowed": True,
        "populate_by_name": True,
        "json_encoders": {ObjectId: str},
    }
