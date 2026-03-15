from core.db import get_engine, connect_to_mongo
from models.schemas import PersonalDocument
import asyncio

async def check_docs():
    await connect_to_mongo()
    engine = get_engine()
    docs = await engine.find(PersonalDocument)
    for doc in docs:
        print(f"ID: {doc.id} | Name: {doc.document_name} | Path: {doc.saved_filepath}")

if __name__ == "__main__":
    asyncio.run(check_docs())
