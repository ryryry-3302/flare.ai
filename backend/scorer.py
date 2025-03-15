from google import genai
from google.genai import types
from dotenv import load_dotenv
import os
from typing_extensions import TypedDict, List

load_dotenv()

class Comment(TypedDict):
    """
    Comment for a quoted text in the essay.
    
    Attributes:
        start_index (int): The starting character index of the quoted text.
        end_index (int): The ending character index of the quoted text.
        comment (str): The content of the comment, It can be a suggestion, a correction, 
            or a general feedback on the quoted content. It can also identify good vocabulary or grammar usage.
    """
    start_index: int
    end_index: int
    comment: str

class RubricScore(TypedDict):
    """
    RubricScore represents the evaluation for a specific rubric category.
    
    Attributes:
        category (str): The rubric category (Ideas, Organization, Voice, Word Choice, Sentence Fluency, Conventions).
        score (int): Numeric score for the category (It must be within 1 to 5).
        explanation (List[str]): List of explanation points for the score.
        comments (List[Comment]): List of comments, each with a start index, an end index, and the comment itself.
    """
    category: str
    score: int
    explanation: List[str]
    comments: List[Comment]

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def grade_essay(essay):
    with open('media/rubrics.txt', 'r') as file:
        rubrics = file.read()
    prompt = f"""
            You are an expert in evaluating essays. Your task is to evaluate the given essay based on the provided rubrics.
            The essay is provided in the 'essay' variable and the rubrics are provided in the 'rubrics' variable.
            Please read the essay and rubrics carefully and provide a detailed evaluation of the essay based on the rubrics.
            You should provide a score for each rubric and a detailed explanation for each score.
            
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
    return response.text

if __name__ == "__main__":
    from transcribe_from_image import extract_text_from_image
    essay = extract_text_from_image("media\Anchor  - 2a_page_1.png")
    score = grade_essay(essay)
    print(score)
