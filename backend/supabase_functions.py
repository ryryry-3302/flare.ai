import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Retrieve the Supabase URL and API key from environment variables
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")

# Initialize the Supabase client
supabase: Client = create_client(url, key)

def insert_to_supabase(table_name, data: dict):
    response = supabase.table(table_name).insert(data).execute()
    return response

def select_all_from_supabase(table_name):
    """Select all data from a table"""
    response = supabase.table(table_name).select('*').execute()
    return response.data

def filter_from_supabase(table_name, column_name, value):
    """Select data from Supabase"""
    response = supabase.table(table_name).select('*').eq(column_name, value).execute()
    return response.data

def delete_from_supabase(table_name, column_name, value):
    """Delete data from Supabase"""
    response = supabase.table(table_name).delete().eq(column_name, value).execute()
    return response

if __name__ == "__main__":
    # Example usage
    table_name = "Essays"
    data = {
        "essay_body": "test",
        "grading": "{}"
    }
    insert_response = insert_to_supabase(table_name, data)
    print(f"Insert response: {insert_response}")

    select_response = select_all_from_supabase(table_name)
    print(f"Select response: {select_response}")

    filter_response = filter_from_supabase(table_name, 'id', '1')
    print(f"Filter response: {filter_response}")
