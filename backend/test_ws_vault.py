import asyncio
import websockets
import json

async def run_query(websocket, query):
    print(f"\nQUERY: {query}")
    await websocket.send(json.dumps({"query": query}))
    results = []
    while True:
        try:
            raw_resp = await websocket.recv()
            resp = json.loads(raw_resp)
            if resp["type"] == "status":
                print(f" [STATUS] {resp['message']}")
            elif resp["type"] == "chunk":
                chunk = resp["content"]
                print(chunk, end="", flush=True)
                results.append(chunk)
            elif resp["type"] == "done":
                print("\n[DONE]")
                break
            elif resp["type"] == "error":
                print(f"\n[ERROR] {resp['message']}")
                break
        except Exception as e:
            print(f"\n[EXCEPTION] {e}")
            break
    return "".join(results)

async def test_chat_flow():
    uri = "ws://localhost:8000/ws/chat"
    async with websockets.connect(uri) as websocket:
        # Test 1: General Requirement Query
        await run_query(websocket, "What identity documents do I need for Nepali citizens?")
        
        # Test 2: Negative Consent
        await run_query(websocket, "How do I fill my citizenship details?")
        
        # Test 3: Positive Consent
        await run_query(websocket, "You can access my citizenship card. What is my name according to it?")

if __name__ == "__main__":
    asyncio.run(test_chat_flow())
