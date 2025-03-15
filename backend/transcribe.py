from google import genai
import PIL.Image
from dotenv import load_dotenv
import os

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def extract_text_from_image(image_path):
    organ = PIL.Image.open(image_path)
    response = client.models.generate_content(
        model="gemini-2.0-flash-thinking-exp-01-21", contents=["Extract text", organ]
    )
    return response.text

if __name__ == "__main__":
    result = extract_text_from_image("image.png")
    print(result)
