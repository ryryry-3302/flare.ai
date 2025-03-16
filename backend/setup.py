from brainbase_labs import BrainbaseLabs
import os

# load from .env
from dotenv import load_dotenv
load_dotenv()

# create brainbase client
# if os.environ["DEPLOYMENT_TYPE"] == "development":
#     bb = BrainbaseLabs(
#         base_url=os.environ["BRAINBASE_BASE_URL"],
#         api_key=os.environ["BB_KEY"]
#     )
# else:
#     bb = BrainbaseLabs(
#         api_key=os.environ["BB_KEY"]
#     )
bb = BrainbaseLabs(
        api_key=os.environ["BB_KEY"]
)
# 1. list workers
workers = bb.workers.list()
# print(workers)

# 2. create worker
new_worker = bb.workers.create(
    name="Grammar Checker",
    description="Check grammar and spelling errors in text",
    status="active"
)
print(new_worker.id)

# 3. create new flow version
new_flow = bb.workers.flows.create(
    worker_id=new_worker.id,
    path="grammar.based",
    name="Grammar Checker",
    label="v1",
    validate=False
)
print(new_flow.id)