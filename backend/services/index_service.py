import os
import json
import base64
import asyncio
from openai import AsyncAzureOpenAI
from core.config import settings

class IndexService:
    def __init__(self):
        self.client = None
        if settings.AZURE_OPENAI_API_KEY and settings.AZURE_OPENAI_ENDPOINT:
            self.client = AsyncAzureOpenAI(
                api_key=settings.AZURE_OPENAI_API_KEY,
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
                api_version=settings.AZURE_OPENAI_API_VERSION
            )

    def encode_image(self, image_path: str):
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')

    async def process_legal_batch(self, batch_name: str, file_paths: list[str]):
        """
        Iterates through files, calls Azure OpenAI Vision for each, 
        and compiles a master ledger. Updates MongoDB progress.
        """
        from core.db import get_engine
        from models.schemas import LegalBatch
        
        import re
        engine = get_engine()
        sanitized_batch = re.sub(r'[^a-zA-Z0-9_-]', '_', batch_name)
        
        # 0. Initial Status Update
        batch = await engine.find_one(LegalBatch, LegalBatch.batch_name == sanitized_batch)
        if batch:
            batch.status = "indexing"
            batch.total_pages = len(file_paths)
            batch.processed_pages = 0
            await engine.save(batch)

        if not self.client:
            print("Azure OpenAI Client not configured. Skipping indexing.")
            if batch:
                batch.status = "error"
                await engine.save(batch)
            return

        master_index = {
            "batch_name": batch_name,
            "processed_at": os.popen('date').read().strip(),
            "pages": []
        }

        system_prompt = (
            "You are an expert legal document parser. Extract the structure of the "
            "provided document image and output ONLY valid JSON. Do not include "
            "markdown formatting like ```json or any other text.\n\n"
            "The JSON structure MUST follow this schema:\n"
            "{\n"
            "  \"page_number\": <int>,\n"
            "  \"document_title\": \"<string>\",\n"
            "  \"content_tree\": [\n"
            "    {\n"
            "      \"node_type\": \"heading\",\n"
            "      \"title\": \"<string>\",\n"
            "      \"children\": [\n"
            "        {\n"
            "          \"node_type\": \"subheading\",\n"
            "          \"title\": \"<string>\",\n"
            "          \"paragraph_text\": \"<string>\"\n"
            "        }\n"
            "      ]\n"
            "    }\n"
            "  ]\n"
            "}"
        )

        for index, path in enumerate(file_paths, start=1):
            if not (path.lower().endswith(('.png', '.jpg', '.jpeg'))):
                print(f"Skipping non-image file: {path}")
                continue

            print(f"Processing page {index}: {path}")
            base64_image = self.encode_image(path)

            try:
                response = await self.client.chat.completions.create(
                    model=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": "Extract the hierarchy of this document page as JSON."},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{base64_image}"
                                    }
                                }
                            ]
                        }
                    ],
                    max_completion_tokens=2000
                )

                content = response.choices[0].message.content.strip()
                if content.startswith("```json"):
                    content = content.replace("```json", "").replace("```", "").strip()
                
                page_data = json.loads(content)
                master_index["pages"].append(page_data)

            except Exception as e:
                print(f"Error processing page {index}: {e}")
                master_index["pages"].append({
                    "page_number": index,
                    "error": str(e),
                    "filepath": path
                })
            
            # Update Progress in DB
            if batch:
                batch.processed_pages = index
                await engine.save(batch)

        # Save the master ledger
        target_dir = settings.JSON_STORAGE
        os.makedirs(target_dir, exist_ok=True)
        
        index_file_path = os.path.join(target_dir, f"{sanitized_batch}.json")
        with open(index_file_path, "w") as f:
            json.dump(master_index, f, indent=2)

        if batch:
            batch.status = "completed"
            await engine.save(batch)

        print(f"Master index saved to: {index_file_path}")
        return master_index

index_service = IndexService()
