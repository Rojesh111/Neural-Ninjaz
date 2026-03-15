from core.db import connect_to_mongo
from services.search_service import get_personal_document
import asyncio
import os

async def test_vision():
    await connect_to_mongo()
    print("Testing fuzzy search for 'citizenship'...")
    result = await get_personal_document("citizenship")
    print("\n--- EXTRACTION RESULT ---")
    print(result)
    print("-------------------------\n")

if __name__ == "__main__":
    asyncio.run(test_vision())
