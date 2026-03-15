from motor.motor_asyncio import AsyncIOMotorClient
from odmantic import AIOEngine
from .config import settings

class Database:
    client: AsyncIOMotorClient = None
    db = None
    engine: AIOEngine = None

db_instance = Database()

async def connect_to_mongo():
    db_instance.client = AsyncIOMotorClient(settings.MONGODB_URI)
    db_instance.db = db_instance.client[settings.DATABASE_NAME]
    db_instance.engine = AIOEngine(client=db_instance.client, database=settings.DATABASE_NAME)
    print(f"Connected to MongoDB: {settings.DATABASE_NAME} with ODMantic")

async def close_mongo_connection():
    db_instance.client.close()
    print("Closed MongoDB connection")

def get_db():
    return db_instance.db

def get_engine():
    return db_instance.engine

def get_collection(name: str):
    return db_instance.db[name]
