from datetime import datetime, UTC
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId


class AdditionalInfo(BaseModel):
    looking_for_upskilling: Optional[bool] = None
    receive_career_guidance: Optional[bool] = None


class User(BaseModel):
    id: Optional[ObjectId] = Field(default_factory=ObjectId, alias="_id")
    username: str
    email: EmailStr
    phone: str
    password_hash: str
    dob: datetime
    domain_preferences: List[str] = Field(default_factory=list)
    role: str
    field_of_work: str
    experience: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    additional_info: Optional[AdditionalInfo] = None

    model_config = {
        "arbitrary_types_allowed": True,
        "populate_by_name": True,
        "json_encoders": {ObjectId: str},
    }
