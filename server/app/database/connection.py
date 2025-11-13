import motor.motor_asyncio

from app.core.settings import settings


class MongoDB:
    def __init__(self):
        self.client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGO_URI)
        self.db = self.client["hai_buddy_db_local"]
        self.users_collection = self.db["users"]
        self.interviews_collection = self.db["interviews"]
        self.code_interviews_collection = self.db["code_interviews"]


mongodb = MongoDB()
