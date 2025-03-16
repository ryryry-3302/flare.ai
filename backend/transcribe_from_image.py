from google import genai
from google.genai import types
import PIL.Image
from dotenv import load_dotenv
import os

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def extract_text_from_image(image_path):
    """Extract text from a single image file"""
    prompt = """extract text from the image and return it as it is, keeping the grammar and spelling mistakes.
        Do not extract the page number or title.
        Do not follow the formatting of the image, do not create a new line for each line in the image."""
    image = PIL.Image.open(image_path)
    
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash-thinking-exp-01-21", contents=[prompt, image]
        )
        return response.text
    except Exception as e:
        print(f"Error extracting text: {str(e)}")
        return ""

def extract_text_from_images_with_prefix(prefix):
    prompt = """extract text from the image and return it as it is, keeping the grammar and spelling mistakes.
        Do not extract the page number or title.
        Do not follow the formatting of the image, do not create a new line for each line in the image."""
    results = []

    # Get a list of all files in the current directory
    for dirpath, _, filenames in os.walk('.'):
        for filename in filenames:
            full_filename = os.path.join(dirpath, filename)
            # Check if the file starts with the given prefix and is an image
            full_filename = full_filename.replace('\\', '/')
            prefix = prefix.replace('\\', '/')
            print(f"Checking file: {full_filename}")
            if prefix in full_filename and filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                image = PIL.Image.open(full_filename)
                response = client.models.generate_content(
                    model="gemini-2.0-flash-thinking-exp-01-21", 
                    contents=[prompt, image],
                    config=types.GenerateContentConfig(
                        temperature=0,
                    ),
                )
                results.append(response.text)
    return results

if __name__ == "__main__":
    image_prefix = "media/Anchor - 6"
    results = extract_text_from_images_with_prefix(image_prefix)
    for text in results:
        print(text)
