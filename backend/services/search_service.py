import os
import json
import base64
from core.config import settings
from core.db import get_engine
from models.schemas import PersonalDocument
from openai import AsyncAzureOpenAI

async def get_personal_document(requested_doc_name: str):
    """
    Searches the personal vault for a document by name (fuzzy) 
    and extracts its text content using Vision.
    """
    engine = get_engine()
    # Case-insensitive regex search
    doc = await engine.find_one(PersonalDocument, {"document_name": {"$regex": requested_doc_name, "$options": "i"}})
    
    if not doc:
        return "Document not found in the personal vault."
    
    file_path = doc.saved_filepath
    if not os.path.exists(file_path):
        return f"Error: Physical file for {doc.document_name} is missing on disk."

    # Vision Extraction
    client = AsyncAzureOpenAI(
        api_key=settings.AZURE_OPENAI_API_KEY,
        azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
        api_version=settings.AZURE_OPENAI_API_VERSION
    )

    with open(file_path, "rb") as image_file:
        base64_image = base64.b64encode(image_file.read()).decode('utf-8')

    try:
        response = await client.chat.completions.create(
            model=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
            messages=[
                {"role": "system", "content": "Extract all personal details, names, numbers, and relevant text from this identity document. Output as plain text."},
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                    ]
                }
            ]
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Error during vision extraction: {str(e)}"

def get_json_data(batch_name: str):
    sanitized_batch = batch_name.replace(" ", "_")
    file_path = os.path.join(settings.JSON_STORAGE, f"{sanitized_batch}.json")
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"JSON index not found for batch: {batch_name} at {file_path}")
    with open(file_path, "r") as f:
        return json.load(f)

def get_subheadings(section_title: str, data: dict):
    """Finds the matching root heading and returns titles of its child subheadings."""
    subheadings = []
    for page in data.get("pages", []):
        for node in page.get("content_tree", []):
            if node.get("node_type") == "heading" and node.get("title") == section_title:
                for child in node.get("children", []):
                    if child.get("node_type") == "subheading":
                        subheadings.append(child.get("title"))
    return subheadings

def get_paragraph(subheading_title: str, data: dict):
    """Finds the matching subheading and returns its paragraph_text."""
    for page in data.get("pages", []):
        for node in page.get("content_tree", []):
            if node.get("node_type") == "heading":
                for child in node.get("children", []):
                    if child.get("node_type") == "subheading" and child.get("title") == subheading_title:
                        return child.get("paragraph_text")
    return "Subheading not found."

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_subheadings",
            "description": "Explore the subheadings under a specific major heading/section to see more details.",
            "parameters": {
                "type": "object",
                "properties": {
                    "section_title": {
                        "type": "string",
                        "description": "The exact title of the major section/heading."
                    }
                },
                "required": ["section_title"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_paragraph",
            "description": "Retrieve the specific text content of a subheading.",
            "parameters": {
                "type": "object",
                "properties": {
                    "subheading_title": {
                        "type": "string",
                        "description": "The exact title of the subheading to read."
                    }
                },
                "required": ["subheading_title"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_personal_document",
            "description": "Retrieve and extract text details from a personal identity document in the secure vault.",
            "parameters": {
                "type": "object",
                "properties": {
                    "requested_doc_name": {
                        "type": "string",
                        "description": "The name or type of document to search for (e.g., 'citizenship', 'passport')."
                    }
                },
                "required": ["requested_doc_name"]
            }
        }
    }
]
