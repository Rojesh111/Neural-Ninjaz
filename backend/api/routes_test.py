from fastapi import APIRouter, HTTPException
import os
from pydantic import BaseModel
import json
from services.search_service import get_json_data, get_subheadings, get_paragraph, TOOLS
from openai import AsyncAzureOpenAI
from core.config import settings

router = APIRouter()

class TestChatRequest(BaseModel):
    query: str
    batch_name: str

@router.get("/batches")
async def list_batches():
    """Lists all available JSON indices in media/json/."""
    try:
        if not os.path.exists(settings.JSON_STORAGE):
            return {"batches": [], "error": "Storage directory missing"}
        files = os.listdir(settings.JSON_STORAGE)
        # Filter for .json files and remove extension
        batches = [f.replace(".json", "") for f in files if f.endswith(".json")]
        return {"batches": batches}
    except Exception as e:
        print(f"[ERROR] /api/batches: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/test/chat")
async def test_chat_endpoint(req: TestChatRequest):
    print(f"\n--- [DEBUG] User Query Received: {req.query} ---")
    
    try:
        data = get_json_data(req.batch_name)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # Step 1: Extract Top-Level Headings
    headings = []
    for page in data.get("pages", []):
        for node in page.get("content_tree", []):
            if node.get("node_type") == "heading":
                headings.append(node.get("title"))
    
    print(f"[DEBUG] Top-Level Headings Available: {headings}")

    client = AsyncAzureOpenAI(
        api_key=settings.AZURE_OPENAI_API_KEY,
        azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
        api_version=settings.AZURE_OPENAI_API_VERSION
    )

    messages = [
        {
            "role": "system", 
            "content": (
                "You are an expert legal assistant. Use your tools to drill down into the document. "
                f"The available top-level sections are: {', '.join(headings)}. "
                "CRITICAL: If the user asks about a specific person or document type (like Nepali citizens), "
                "look for sections related to 'Identity', 'Registration', or 'Application' and explore their subheadings. "
                "Do not give up until you have checked all plausible sections."
            )
        },
        {"role": "user", "content": req.query}
    ]

    # --- EXECUTION LOOP ---
    max_loops = 5
    loop_count = 0
    
    while loop_count < max_loops:
        loop_count += 1
        
        response = await client.chat.completions.create(
            model=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto"
        )

        response_message = response.choices[0].message
        
        # Check if AI wants to call a tool
        if response_message.tool_calls:
            messages.append(response_message)
            
            for tool_call in response_message.tool_calls:
                func_name = tool_call.function.name
                func_args = json.loads(tool_call.function.arguments)
                
                print(f"[DEBUG] AI called tool: {func_name} with args: {func_args}")
                
                result = ""
                if func_name == "get_subheadings":
                    result = get_subheadings(func_args.get("section_title"), data)
                elif func_name == "get_paragraph":
                    result = get_paragraph(func_args.get("subheading_title"), data)
                
                print(f"[DEBUG] Python returning to AI: {result}")
                
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": func_name,
                    "content": json.dumps(result)
                })
        else:
            # Final Answer
            print(f"--- [DEBUG] Final AI Answer Generated. ---")
            return {"response": response_message.content}

    return {"response": "AI processing timed out or reached maximum depth."}
