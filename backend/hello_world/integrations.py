from brainbase_labs import BrainbaseLabs
import os

# load from .env
from dotenv import load_dotenv
load_dotenv()

# create brainbase client
api_key = os.getenv("BB_KEY")

print(api_key)
bb = BrainbaseLabs(api_key=os.getenv("BB_KEY"))

# 1. list integrations
integrations = bb.team.integrations.list()
print(integrations)


# 2. list phone numbers
phone_numbers = bb.team.assets.list_phone_numbers()
print(phone_numbers)
