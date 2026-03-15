import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.search_service import get_json_data, get_subheadings, get_paragraph, get_personal_document, TOOLS
from services.firewall_service import firewall_service
from openai import AsyncAzureOpenAI
from core.config import settings

router = APIRouter()

@router.websocket("/ws/chat")
async def chat_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    client = AsyncAzureOpenAI(
        api_key=settings.AZURE_OPENAI_API_KEY,
        azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
        api_version=settings.AZURE_OPENAI_API_VERSION
    )

    try:
        while True:
            # 1. Receive JSON Request
            raw_data = await websocket.receive_text()
            data_json = json.loads(raw_data)
            query = data_json.get("query")
            batch_name = data_json.get("batch_name")

            if not query or not batch_name:
                continue

            # Load Document Data for tools
            try:
                doc_data = get_json_data(batch_name)
            except Exception as e:
                await websocket.send_json({"type": "status", "message": f"Error loading index: {str(e)}"})
                continue

            print(f"\n--- [DEBUG] WebSocket Query: {query} (Batch: {batch_name}) ---")

            # --- TWO-LAYER FIREWALL CHECK ---
            # Initial ML Check
            firewall_result = await firewall_service.analyze_prompt(query)
            
            # If Layer 2 (Guard AI) was triggered, notify the user
            if firewall_result.get("layer") == 2:
                await websocket.send_json({
                    "type": "status", 
                    "message": "🛡️ Deep security audit in progress..."
                })
                # Re-run or just use the result (analyze_prompt already ran Layer 2 if needed)
            
            if not firewall_result["is_safe"]:
                print(f"[SECURITY] Malicious prompt blocked! Layer: {firewall_result.get('layer')} | Reasoning: {firewall_result.get('reasoning')}")
                await websocket.send_json({
                    "type": "status", 
                    "message": "🔥 Security Alert: Dangerous prompt detected."
                })
                await websocket.send_json({
                    "type": "error",
                    "message": f"Your request was blocked by the security firewall. Reason: {firewall_result.get('reasoning', 'Potential prompt injection attempt.')}"
                })
                await websocket.send_json({"type": "done"})
                continue

            # Extract Headings for System Prompt
            headings = []
            for page in doc_data.get("pages", []):
                for node in page.get("content_tree", []):
                    if node.get("node_type") == "heading":
                        headings.append(node.get("title"))

            messages = [
                {
                    "role": "system", 
                    "content": (
                        "You are a specialized Legal Assistant for the Buster Zero-Trust Index. "
                        "Your goal is to provide direct, professional answers based on document content. "
                        f"The document contains these sections: {', '.join(headings)}. "
                        "\nSTRICT OUTPUT FORMAT:\n"
                        "1. Begin with [THOUGHTS]\n"
                        "2. Describe your reasoning, section checks, and ambiguity analysis.\n"
                        "3. End with [ANSWER]\n"
                        "4. Provide ONLY the professional legal answer based on your findings.\n"
                        "\nDRIVE FOR ACCURACY: If a user asks about procedures or requirements, check all relevant sections. "
                        "Do not stop after checking one section if the answer is incomplete.\n"
                        "\nSECURE VAULT ACCESS:\n"
                        "You have access to a tool called get_personal_document. You are STRICTLY FORBIDDEN from using this tool unless the user explicitly grants you permission in their current message (e.g., 'you can access my citizenship card' or 'use my passport'). "
                        "If they ask you to fill out a form but haven't given permission, you must ask them: 'May I access your [Document Name] to fill this out?'"
                    )
                },
                {"role": "user", "content": query}
            ]

            # --- DRILL-DOWN LOOP ---
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
                
                if response_message.tool_calls:
                    messages.append(response_message)
                    
                    for tool_call in response_message.tool_calls:
                        func_name = tool_call.function.name
                        func_args = json.loads(tool_call.function.arguments)
                        
                        # UI STATUS UPDATE
                        print(f"[DEBUG] AI calling {func_name} with: {func_args}")
                        status_msg = f"Exploring {func_name}..."
                        if func_name == "get_personal_document":
                            status_msg = f"Retrieving {func_args.get('requested_doc_name')} from secure vault..."
                            
                        await websocket.send_json({
                            "type": "status", 
                            "message": status_msg
                        })
                        
                        result = ""
                        if func_name == "get_subheadings":
                            result = get_subheadings(func_args.get("section_title"), doc_data)
                        elif func_name == "get_paragraph":
                            result = get_paragraph(func_args.get("subheading_title"), doc_data)
                        elif func_name == "get_personal_document":
                            result = await get_personal_document(func_args.get("requested_doc_name"))
                        
                        print(f"[DEBUG] Tool result size: {len(str(result))} chars")
                        
                        messages.append({
                            "role": "tool",
                            "tool_call_id": tool_call.id,
                            "name": func_name,
                            "content": json.dumps(result)
                        })
                else:
                    # Final Answer - STREAMING WITH REASONING FILTER
                    print(f"[DEBUG] Final Answer Generation Started.")
                    await websocket.send_json({"type": "status", "message": "Analyzing data..."})
                    
                    stream_response = await client.chat.completions.create(
                        model=settings.AZURE_OPENAI_DEPLOYMENT_NAME,
                        messages=messages,
                        stream=True
                    )
                    
                    full_completion = ""
                    is_answering = False
                    buffer = ""
                    
                    async for chunk in stream_response:
                        if chunk.choices and chunk.choices[0].delta.content:
                            chunk_text = chunk.choices[0].delta.content
                            full_completion += chunk_text
                            
                            if is_answering:
                                # Stop streaming if AI starts another [THOUGHTS] block at the end
                                if "[THOUGHTS]" in chunk_text or "[THOUGHTS]" in (full_completion[-20:]):
                                    break
                                await websocket.send_json({"type": "chunk", "content": chunk_text})
                            else:
                                buffer += chunk_text
                                if "[ANSWER]" in buffer:
                                    is_answering = True
                                    answer_part = buffer.split("[ANSWER]", 1)[1]
                                    if answer_part:
                                        # Clean up any trailing tags if they somehow appeared in the split
                                        if "[THOUGHTS]" in answer_part:
                                            answer_part = answer_part.split("[THOUGHTS]")[0]
                                        await websocket.send_json({"type": "chunk", "content": answer_part})
                                    await websocket.send_json({"type": "status", "message": ""})
                    
                    # Store in history for memory
                    messages.append({"role": "assistant", "content": full_completion})
                    
                    # DONE Signal
                    await websocket.send_json({"type": "done"})
                    break

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"WS Error: {e}")
        try:
            await websocket.send_json({"type": "status", "message": f"Error: {str(e)}"})
        except:
            pass
