from google import genai
from google.genai import types
from dotenv import load_dotenv
import os
from typing_extensions import TypedDict, List

load_dotenv()

class ErrorCorrection(TypedDict):
    """
    Represents detected errors in a given text, including grammar, punctuation, and spelling mistakes.
    
    Attributes:
        error (str): The error.
        starting_index (int): The starting character index of each error in the original text.
        corrected (str): The corrected versions of the error.
    """
    error: str
    starting_index: int
    corrected: str

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def corrections_from_essay(essay):
    prompt = f"""
            Analyze the essay and find all grammar, punctuation and spelling errors.
            
            <essay>
            {essay}
            </essay>"""
    
    response = client.models.generate_content(
        model="gemini-2.0-flash-thinking-exp-01-21",
        contents=[prompt],
        config=types.GenerateContentConfig(
            temperature=0,
            response_mime_type="application/json",
            response_schema=list[ErrorCorrection]
        ),
    )
    
    # Parse the response text as JSON
    import json
    try:
        return json.loads(response.text)
    except json.JSONDecodeError:
        print("Failed to parse response as JSON:", response.text)
        return response.text

if __name__ == "__main__":
    from transcribe_from_image import extract_text_from_images_with_prefix
    essay_parts = extract_text_from_images_with_prefix("media\Anchor - 6")
    essay = " ".join(essay_parts)
    print(essay)
    score = corrections_from_essay(essay)
    print(score)
