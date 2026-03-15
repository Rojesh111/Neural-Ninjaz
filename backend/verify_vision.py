import asyncio
import os
import sys
import json

# Add backend to path
sys.path.append(os.getcwd())

from services.index_service import index_service
from core.config import settings

async def test_json_path():
    test_image = "/home/kali/Desktop/Hackathon/BureacyBuster/TestSamples/images/Gemini_Generated_Image_e889dye889dye889.png"
    batch_name = "New_Storage_Test"
    
    print(f"Testing JSON storage refactor with {batch_name}...")
    result = await index_service.process_legal_batch(batch_name, [test_image])
    
    expected_path = os.path.join(settings.JSON_STORAGE, f"{batch_name}.json")
    
    if os.path.exists(expected_path):
        print(f"✅ Success! JSON index found at: {expected_path}")
        with open(expected_path, "r") as f:
            data = json.load(f)
            print(f"Batch Name in JSON: {data.get('batch_name')}")
    else:
        print(f"❌ Failure! JSON index NOT found at: {expected_path}")

if __name__ == "__main__":
    asyncio.run(test_json_path())
