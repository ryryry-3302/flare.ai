import asyncio
import json
import aiohttp
import sys
import os

class BrainbaseRunner:
    def __init__(self, worker_id, flow_id, api_key, input_text="", host="wss://brainbase-engine-python.onrender.com"):
        self.worker_id = worker_id
        self.flow_id = flow_id
        self.api_key = api_key
        self.host = host
        self.url = f"{self.host}/{self.worker_id}/{self.flow_id}?api_key={self.api_key}"
        self.response_text = ""  # To accumulate the response from the server.
        self.done_event = asyncio.Event()  # Will be set when a "done" message is received.
        self.input_text = input_text  # Store the input text
    
    async def start(self):
        async with aiohttp.ClientSession() as session:
            async with session.ws_connect(self.url) as ws:
                print(f"Connected to {self.url}")
                await self._initialize(ws)
                # Start listening for responses.
                listen_task = asyncio.create_task(self._listen(ws))
                # Send the file content as a message.
                await self._chat(ws)
                # Wait until the "done" message is received.
                await self.done_event.wait()
                # Ensure the listener task finishes.
                await listen_task

    async def _initialize(self, ws):
        init_data = {
            "streaming": True,
            "deploymentType": os.environ.get("DEPLOYMENT_TYPE", "production")
        }
        init_message = {
            "action": "initialize",
            "data": json.dumps(init_data)
        }
        await ws.send_str(json.dumps(init_message))
        print("Initialization message sent.")
    
    async def _listen(self, ws):
        streaming_active = False
        try:
            async for msg in ws:
                if msg.type == aiohttp.WSMsgType.TEXT:
                    try:
                        message_obj = json.loads(msg.data)
                        action = message_obj.get("action")
                        if action in ["message", "response"]:
                            # For non-streamed responses.
                            text = message_obj["data"].get("message")
                            if text:
                                self.response_text += text + "\n"
                                print("Agent:", text)
                        elif action == "stream":
                            # For streamed responses.
                            stream_chunk = message_obj["data"].get("message", "")
                            self.response_text += stream_chunk
                            if not streaming_active:
                                print("Agent: ", end="")
                                streaming_active = True
                            print(stream_chunk, end="")
                            sys.stdout.flush()
                        elif action == "function_call":
                            print("Function call requested:", message_obj["data"].get("function"))
                        elif action == "error":
                            print("Error from server:", message_obj["data"].get("message"))
                        elif action == "done":
                            if streaming_active:
                                print()  # End the streaming line.
                                streaming_active = False
                            print("Operation completed successfully:", message_obj["data"])
                            self.done_event.set()  # Signal that the operation is done.
                            break  # Exit the loop.
                        else:
                            print("Unknown action received:", action)
                    except Exception as e:
                        print("Error parsing message:", e)
                elif msg.type == aiohttp.WSMsgType.ERROR:
                    print("WebSocket error:", ws.exception())
                    break
        except Exception as e:
            print("Listener encountered an error:", e)
    
    async def _chat(self, ws):
        # Use the stored input text instead of reading from a file
        user_input = self.input_text
        chat_message = {
            "action": "message",
            "data": {"message": user_input}
        }
        try:
            await ws.send_str(json.dumps(chat_message))
            print("Sent message from input file.")
        except Exception as e:
            print("Failed to send message:", e)

async def main():
    worker_id = "worker_53db5a9b-f435-4db8-bcd3-ba636fa237fc"
    flow_id = "flow_6deb60e2-1637-462c-997a-e683238e72a6"
    api_key = "sk_27583a53bba1dcbb8b7b7d91bae2eace04489205d091068a3ea845afb42e"
    
    # Read input from input.txt
    try:
        with open("media/input.txt", "r") as f:
            input_text = f.read()
        print("Read input from input.txt")
    except Exception as e:
        print("Error reading input file:", e)
        input_text = ""
        
    connection = BrainbaseRunner(worker_id, flow_id, api_key, input_text)
    await connection.start()
    # Once the websocket operation is done, write the response to output.txt.
    try:
        with open("media/output.txt", "w") as f:
            f.write(connection.response_text)
        print("Response saved to output.txt")
    except Exception as e:
        print("Error writing output file:", e)

if __name__ == '__main__':
    asyncio.run(main())
