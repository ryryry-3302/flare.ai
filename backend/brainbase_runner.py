import asyncio
import json
import aiohttp
import sys 
import os
import ssl
import base64
from PIL import Image

class BrainbaseRunner:
    def __init__(self, worker_id, flow_id, api_key, host="wss://brainbase-engine-python.onrender.com"):
        self.worker_id = worker_id
        self.flow_id = flow_id
        self.api_key = api_key
        self.host = host
        # Construct the URL using a secure WebSocket connection.
        self.url = f"{self.host}/{self.worker_id}/{self.flow_id}?api_key={self.api_key}"
        
        # Create SSL context
        self.ssl_context = ssl.create_default_context()
        self.ssl_context.check_hostname = False
        self.ssl_context.verify_mode = ssl.CERT_NONE
    
    async def start(self):
        print(f"Connecting to {self.url} with API Key: {self.api_key}")

        async with aiohttp.ClientSession() as session:
            async with session.ws_connect(self.url, ssl=self.ssl_context) as ws:
                print(f"Connected to {self.url}")
                # Send an initialization message to the engine.
                await self._initialize(ws)
                # Create tasks: one to listen to server messages and one to let the user send chat messages.
                listen_task = asyncio.create_task(self._listen(ws))
                chat_task = asyncio.create_task(self._chat(ws))
                # Wait until one of the tasks completes (e.g. the user exits, or the connection stops).
                done, pending = await asyncio.wait(
                    [listen_task, chat_task],
                    return_when=asyncio.FIRST_COMPLETED
                )
                # Cancel any remaining tasks.
                for task in pending:
                    task.cancel()
    
    async def _initialize(self, ws):
        init_data = {
            "streaming": True,
            "deploymentType": "production"
        }
        init_message = {
            "action": "initialize",
            "data": json.dumps(init_data)
        }
        await ws.send_str(json.dumps(init_message))
        print("Initialization message sent.")
    
    async def send_image(self, ws, image_path):
        # Open and encode the image to base64
        with open(image_path, "rb") as image_file:
            image_data = base64.b64encode(image_file.read()).decode('utf-8')

        # Send image data
        image_message = {
            "action": "process_image",
            "data": {"image": image_data}
        }
        await ws.send_str(json.dumps(image_message))
        print("Image data sent.")
    
    async def _listen(self, ws):
        # Create a buffer to accumulate streaming chunks.
        stream_buffer = ""
        streaming_active = False
        try:
            async for msg in ws:
                if msg.type == aiohttp.WSMsgType.TEXT:
                    try:
                        message_obj = json.loads(msg.data)
                        action = message_obj.get("action")
                        if action in ["message", "response"]:
                            # Regular non-streaming message
                            if streaming_active:
                                print()  # finish any previous streaming output
                                streaming_active = False
                                stream_buffer = ""
                            print("Agent:", message_obj["data"].get("message"))
                        elif action == "stream":
                            # Handle streaming content
                            stream_chunk = message_obj["data"].get("message", "")
                            if not streaming_active:
                                # First chunk of a streaming sequence
                                print("Agent: ", end="")
                                streaming_active = True
                                stream_buffer = ""
                            
                            # Print only the new chunk
                            print(stream_chunk, end="")
                            stream_buffer += stream_chunk
                            sys.stdout.flush()
                        elif action == "function_call":
                            if streaming_active:
                                print()  # ensure any pending streaming output ends
                                streaming_active = False
                                stream_buffer = ""
                            print("Function call requested:", message_obj["data"].get("function"))
                        elif action == "error":
                            if streaming_active:
                                print()
                                streaming_active = False
                                stream_buffer = ""
                            print("Error from server:", message_obj["data"].get("message"))
                        elif action == "done":
                            # End of a streamed message: add a newline.
                            if streaming_active:
                                print()
                                streaming_active = False
                                stream_buffer = ""
                            print("Operation completed successfully:", message_obj["data"])
                        else:
                            if streaming_active:
                                print()
                                streaming_active = False
                                stream_buffer = ""
                            print("Unknown action received:", action)
                    except Exception as e:
                        print("Error parsing message:", e)
                elif msg.type == aiohttp.WSMsgType.ERROR:
                    print("WebSocket error:", ws.exception())
                    break
        except Exception as e:
            print("Listener task encountered an error:", e)
    
    async def _chat(self, ws):
        loop = asyncio.get_event_loop()
        # Loop to get user input and then send it via the WebSocket.
        while True:
            # Use run_in_executor to avoid blocking the event loop.
            user_input = await loop.run_in_executor(None, input, "You: \n")
            if user_input.lower() in ["exit", "quit"]:
                print("Exiting chat...")
                await ws.close()
                break
            chat_message = {
                "action": "message",
                "data": {"message": user_input}
            }
            try:
                await ws.send_str(json.dumps(chat_message))
            except Exception as e:
                print("Failed to send message:", e)
                break

# Example usage
# if __name__ == '__main__':
#     runner = BrainbaseRunner("worker_id", "flow_id", os.getenv("BB_KEY"))
#     asyncio.run(runner.start())