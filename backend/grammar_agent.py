import sys
import asyncio
import os
import aiohttp
from brainbase_runner import BrainbaseRunner

async def main():
    if len(sys.argv) < 3:
        print("Usage: python demo.py <worker_id> <flow_id>")
        sys.exit(1)
    
    worker_id = sys.argv[1]
    flow_id = sys.argv[2]
    
    api_key = os.environ["BB_KEY"]   # set your API key in .env

    connection = BrainbaseRunner(worker_id, flow_id, api_key)
    
    async with aiohttp.ClientSession() as session:
        async with session.ws_connect(connection.url, ssl=connection.ssl_context) as ws:
            await connection._initialize(ws)
            # await connection.send_image(ws, "media/image_1.png")
            await connection._listen(ws)

if __name__ == '__main__':
    asyncio.run(main())