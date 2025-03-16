from google import genai
from google.genai import types
from dotenv import load_dotenv
import os
import json
from typing_extensions import TypedDict, List

load_dotenv()

class EssayProgress(TypedDict):
    """
    Represents the progress of a student based on past essays.
    
    Attributes:
        common_mistakes (List[str]): A list of recurring mistakes in the student's essays.
        improvements (List[str]): A list of improvements observed over time.
    """
    common_mistakes: List[str]
    improvements: List[str]

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def analyze_student_progress(essays: List[str]):
    prompt = f"""
            Analyze the following essays written by a student over time. 
            Identify:
            - Common recurring mistakes (list of strings)
            - Notable improvements (list of strings)
            
            <essays>
            {json.dumps(essays)}
            </essays>
            """
    
    response = client.models.generate_content(
        model="gemini-2.0-pro-exp-02-05",
        contents=[prompt],
        config=types.GenerateContentConfig(
            temperature=0,
            response_mime_type="application/json",
            response_schema=EssayProgress,
        ),
    )
    
    try:
        return json.loads(response.text)
    except json.JSONDecodeError:
        print("Failed to parse response as JSON:", response.text)
        return response.text

if __name__ == "__main__":
    sample_essays = [
        """During my summer vacation, I visited my grandparents' house in the countryside. The fresh air and beautiful scenery made me feel relaxed and happy. Every morning, I would wake up early to help my grandmother prepare breakfast. She taught me how to make homemade pancakes, which quickly became my favorite part of the day. In the afternoon, I spent hours exploring the fields and playing with my cousins. One of the most memorable experiences was learning how to fish with my grandfather. Though I was nervous at first, he patiently guided me, and after several attempts, I finally caught my first fish! The entire trip was an unforgettable experience that taught me the importance of family and enjoying the simple moments in life.""",
        """Over the past few months, I have worked hard to improve my writing skills. Initially, I struggled with organizing my ideas clearly, often jumping from one topic to another without smooth transitions. However, after practicing regularly and seeking feedback from my teacher, I have learned how to structure my essays more effectively. Now, I start with an outline to organize my thoughts before writing. Additionally, my vocabulary has expanded significantly. I used to rely on simple words, but I have been actively learning and incorporating more varied and expressive vocabulary into my essays. One of my biggest achievements is improving my grammar. I used to make frequent subject-verb agreement mistakes, but through careful proofreading, I have been able to reduce them. Overall, I am proud of my progress and look forward to continuing to develop my writing skills.""",
        """Throughout my academic journey, writing has been both a challenge and a passion. When I first started, I often found it difficult to convey my ideas clearly. My sentences were short and lacked variation, making my writing sound monotonous. Over time, I have worked diligently to enhance my style by experimenting with different sentence structures and improving my word choice. One significant improvement I have noticed is my ability to write persuasively. In the past, I struggled to support my arguments with strong evidence, but now, I conduct thorough research before writing and ensure that my points are well-supported. Additionally, I have become more mindful of grammatical errors. While I still make occasional mistakes, I have developed a habit of reviewing my work multiple times to correct them. Writing has become a tool for self-expression, and I am excited to continue refining my skills in the future."""
    ]
    progress_report = analyze_student_progress(sample_essays)
    print(progress_report)
