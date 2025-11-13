from typing import List, Optional

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, EmailStr

from app.controllers import user_controller
from app.models.user_model import AdditionalInfo
from app.utils.auth import get_current_user
from app.utils.limiter import limiter

router = APIRouter(prefix="/users", tags=["Users"])


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    domain_preferences: Optional[List[str]] = None
    role: Optional[str] = None
    experience: Optional[int] = None
    field_of_work: Optional[str] = None


class RegisterUser(BaseModel):
    username: str
    email: EmailStr
    password: str
    domain_preferences: List[str]
    role: str


@router.post("/register")
@limiter.limit("10/hour")
async def register(request: Request, user: RegisterUser):
    return await user_controller.register_user(user)


@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, user: UserLogin):
    return await user_controller.login_user(user)


@router.get("/profile")
async def profile(user_id: str = Depends(get_current_user)):
    return await user_controller.get_profile(user_id)


@router.put("/update")
async def update_profile(update_data: UserUpdate, user_id: str = Depends(get_current_user)):
    return await user_controller.update_profile(update_data, user_id)


@router.get("/check-additional-info")
async def check_info(user_id: str = Depends(get_current_user)):
    return await user_controller.check_additional_info(user_id)


@router.put("/update-additional-info")
async def update_info(update_data: AdditionalInfo, user_id: str = Depends(get_current_user)):
    return await user_controller.update_additional_info(update_data, user_id)


@router.delete("/delete")
async def delete(user_id: str = Depends(get_current_user)):
    return await user_controller.delete_account(user_id)


@router.get("/verify-token")
async def verify(user_id: str = Depends(get_current_user)):
    return await user_controller.verify_token(user_id)
