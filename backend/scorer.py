from google import genai
from google.genai import types
from dotenv import load_dotenv
import os
from typing_extensions import TypedDict, List

load_dotenv()

class Comment(TypedDict):
    """Comment on a specific portion of text"""
    comment: str
    start_index: int
    end_index: int

class RubricScore(TypedDict):
    """Score and feedback for a rubric category"""
    category: str
    score: int
    explanation: List[str]
    comments: List[Comment]

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def grade_essay(essay):
    with open('media/rubrics_v2.txt', 'r') as file:
        rubrics = file.read()
    prompt = f"""
            You are an expert in evaluating essays. Your task is to evaluate the given essay based on the provided rubrics.
            The essay is provided in the 'essay' variable and the rubrics are provided in the 'rubrics' variable.
            Please read the essay and rubrics carefully and provide a detailed evaluation of the essay based on the rubrics.
            You should provide a score for each rubric and a detailed explanation for each score.
            
            Scores should be between 1 and 5, where:
            5 = Excellent
            4 = Good
            3 = Satisfactory
            2 = Needs Improvement
            1 = Poor
            
            <essay>
            {essay}
            </essay>
            
            <rubrics>
            {rubrics}
            </rubrics>"""
    
    response = client.models.generate_content(
        model="gemini-2.0-pro-exp-02-05",
        contents=[prompt],
        config=types.GenerateContentConfig(
            temperature=0,
            response_mime_type="application/json",
            response_schema=list[RubricScore]
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
    score = grade_essay(essay)
    print(score)
