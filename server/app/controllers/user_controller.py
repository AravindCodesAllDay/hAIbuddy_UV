from datetime import datetime,UTC

from bson import ObjectId
from fastapi import HTTPException

from app.database.connection import mongodb
from app.models.user_model import AdditionalInfo
from app.utils.auth import (
    hash_password,
    verify_password,
    create_access_token
)

users_collection = mongodb.users_collection


async def register_user(user):
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")

    password_hash = hash_password(user.password)

    user_data = {
        "username": user.username,
        "email": user.email,
        "password_hash": password_hash,
        "domain_preferences": user.domain_preferences,
        "role": user.role,
        "created_at": datetime.now(UTC)
    }

    result = await users_collection.insert_one(user_data)
    return {"message": "User registered successfully", "user_id": str(result.inserted_id)}



async def login_user(user):
    db_user = await users_collection.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(
        {"sub": str(db_user["_id"]), "role": db_user["role"]}
    )
    return {"access_token": token, "token_type": "bearer"}


async def get_profile(user_id: str):
    db_user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "user_id": str(db_user["_id"]),
        "username": db_user["username"],
        "email": db_user["email"],
        "domain_preferences": db_user.get("domain_preferences", []),
        "role": db_user["role"]
    }


async def update_profile(update_data, user_id: str):
    update_fields = {k: v for k, v in update_data.dict().items() if v is not None}
    if not update_fields:
        raise HTTPException(status_code=400, detail="No valid fields provided for update")

    await users_collection.update_one({"_id": ObjectId(user_id)}, {"$set": update_fields})
    return {"message": "Profile updated successfully"}


async def check_additional_info(user_id: str):
    user = await users_collection.find_one(
        {"_id": ObjectId(user_id)}, {"additional_info": 1})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    additional_info = user.get("additional_info", {})
    missing_fields = [field for field in ["looking_for_upskilling", "receive_career_guidance"] if
                      field not in additional_info]
    return {"unfilled_fields": missing_fields} if missing_fields else {
        "message": "All additional info fields are filled"}


async def update_additional_info(update_data: AdditionalInfo, user_id: str):
    update_fields = {k: v for k, v in update_data.model_dump(exclude_unset=True).items() if v is not None}
    if not update_fields:
        raise HTTPException(status_code=400, detail="No valid fields provided for update")

    result = await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"additional_info": update_fields}}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found or no changes made")

    return {"message": "Additional info updated successfully"}


async def delete_account(user_id: str):
    existing_user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")

    delete_result = await users_collection.delete_one({"_id": ObjectId(user_id)})

    if delete_result.deleted_count == 0:
        raise HTTPException(status_code=500, detail="Failed to delete user account")

    return {"message": "User account deleted successfully"}


async def verify_token(user_id: str):
    existing_user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not existing_user:
        raise HTTPException(status_code=404, detail="Invalid or expired token. User does not exist.")

    return {"message": "Token is valid"}
