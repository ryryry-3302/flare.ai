from google import genai
from google.genai import types
from dotenv import load_dotenv
import os
import json
from typing_extensions import TypedDict, List
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem
from reportlab.lib import colors

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

class AssignmentQuestions(TypedDict):
    """
    Represents a set of writing assignment questions tailored to the student's common mistakes.
    
    Attributes:
        sentence_fix (List[str]): A list of sentences with errors similar to the student's mistakes for correction.
        expand_improve (str): A short paragraph needing expansion and improvement.
        word_choice (List[str]): A list of overused or weak words to be replaced with stronger alternatives.
    """
    sentence_fix: List[str]
    expand_improve: str
    word_choice: List[str]

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

def generate_assignment_questions(common_mistakes: List[str]):
    """
    Generate a personalized writing assignment based on the provided common mistakes.
    """
    prompt = f"""
            Based on the following common mistakes made by the student, generate a personalized writing assignment:
            
            - Create 8 sentences with errors similar to the student's common mistakes that they must correct.
            - Provide a short paragraph (3-4 sentences) that lacks details and needs expansion.
            - List 8 weak or overused words the student should replace with stronger alternatives.
            
            <common_mistakes>
            {json.dumps(common_mistakes)}
            </common_mistakes>
            """
    
    response = client.models.generate_content(
        model="gemini-2.0-pro-exp-02-05",
        contents=[prompt],
        config=types.GenerateContentConfig(
            temperature=0.7,
            response_mime_type="application/json",
            response_schema=AssignmentQuestions,
        ),
    )
    
    try:
        return json.loads(response.text)
    except json.JSONDecodeError:
        print("Failed to parse response as JSON:", response.text)
        return response.text

def generate_assignment_pdf(assignment: AssignmentQuestions, due_date: str = None) -> bytes:
    """
    Generate a PDF blob containing the writing assignment.
    
    Args:
        assignment (AssignmentQuestions): The assignment questions to include in the PDF.
        due_date (str, optional): The due date for the assignment. Defaults to None.
        
    Returns:
        bytes: The PDF file as a binary blob.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, title="Writing Assignment")
    
    # Define styles
    styles = getSampleStyleSheet()
    title_style = styles['Title']
    heading_style = styles['Heading2']
    normal_style = styles['Normal']
    
    # Custom styles
    task_style = ParagraphStyle(
        'TaskStyle',
        parent=styles['Italic'],
        textColor=colors.blue,
        spaceAfter=12
    )
    
    # Content elements
    elements = []
    
    # Title
    elements.append(Paragraph("Personalized Writing Assignment", title_style))
    elements.append(Spacer(1, 12))
    
    # Part 1: Sentence Fix-It Challenge
    elements.append(Paragraph("Part 1: Sentence Fix-It Challenge", heading_style))
    elements.append(Paragraph("Below are sentences with mistakes similar to those in your writing. Read each sentence carefully, find the mistakes, and rewrite the sentence correctly.", normal_style))
    elements.append(Spacer(1, 6))
    
    # Add the sentences to fix
    for sentence in assignment["sentence_fix"]:
        elements.append(Paragraph(sentence, normal_style))
        elements.append(Spacer(1, 6))
    
    elements.append(Paragraph("✏️ Task: Rewrite each sentence correctly. If you're unsure what's wrong, try reading the sentence out loud!", task_style))
    elements.append(Spacer(1, 12))
    
    # Part 2: Expand & Improve
    elements.append(Paragraph("Part 2: Expand & Improve", heading_style))
    elements.append(Paragraph("Below is a short paragraph. It is missing important details. Rewrite it by adding more description, sensory words, and stronger sentences to make it more interesting.", normal_style))
    elements.append(Spacer(1, 6))
    
    elements.append(Paragraph("Original Paragraph:", normal_style))
    elements.append(Paragraph(assignment["expand_improve"], normal_style))
    elements.append(Spacer(1, 6))
    
    elements.append(Paragraph("✏️ Task: Rewrite this paragraph by adding more details. What did the beach look like? What did you eat? How did the water feel? Make the reader feel like they are there!", task_style))
    elements.append(Spacer(1, 12))
    
    # Part 3: Word Choice Challenge
    elements.append(Paragraph("Part 3: Word Choice Challenge", heading_style))
    elements.append(Paragraph("Below is a list of boring words that are often overused. Your job is to replace them with stronger, more interesting words!", normal_style))
    elements.append(Spacer(1, 6))
    
    elements.append(Paragraph("Words to Improve:", normal_style))
    
    # Add the words to improve
    word_items = []
    for word in assignment["word_choice"]:
        word_items.append(Paragraph(f"{word} →", normal_style))
    
    elements.append(ListFlowable(word_items, bulletType='bullet', start=None))
    elements.append(Spacer(1, 6))
    
    elements.append(Paragraph("✏️ Task: Write a stronger word next to each one. Then, use at least three of the improved words in a short sentence of your own.", task_style))
    elements.append(Spacer(1, 12))
    
    # Bonus Challenge
    elements.append(Paragraph("💡 Bonus Challenge: Find and fix at least three mistakes in your own recent writing. Write the original mistake and the corrected version.", normal_style))
    elements.append(Spacer(1, 12))
    
    # Due Date
    if due_date:
        elements.append(Paragraph(f"📌 Due Date: {due_date}", normal_style))
    else:
        elements.append(Paragraph("📌 Due Date: [Insert Due Date]", normal_style))
    
    # Build the PDF
    doc.build(elements)
    
    # Get the PDF data
    pdf_data = buffer.getvalue()
    buffer.close()
    
    return pdf_data

if __name__ == "__main__":
    sample_essays = [
        """During my summer vacation, I visited my grandparents' house in the countryside. The fresh air and beautiful scenery made me feel relaxed and happy. Every morning, I would wake up early to help my grandmother prepare breakfast. She taught me how to make homemade pancakes, which quickly became my favorite part of the day. In the afternoon, I spent hours exploring the fields and playing with my cousins. One of the most memorable experiences was learning how to fish with my grandfather. Though I was nervous at first, he patiently guided me, and after several attempts, I finally caught my first fish! The entire trip was an unforgettable experience that taught me the importance of family and enjoying the simple moments in life.""",
        """Over the past few months, I have worked hard to improve my writing skills. Initially, I struggled with organizing my ideas clearly, often jumping from one topic to another without smooth transitions. However, after practicing regularly and seeking feedback from my teacher, I have learned how to structure my essays more effectively. Now, I start with an outline to organize my thoughts before writing. Additionally, my vocabulary has expanded significantly. I used to rely on simple words, but I have been actively learning and incorporating more varied and expressive vocabulary into my essays. One of my biggest achievements is improving my grammar. I used to make frequent subject-verb agreement mistakes, but through careful proofreading, I have been able to reduce them. Overall, I am proud of my progress and look forward to continuing to develop my writing skills.""",
        """Throughout my academic journey, writing has been both a challenge and a passion. When I first started, I often found it difficult to convey my ideas clearly. My sentences were short and lacked variation, making my writing sound monotonous. Over time, I have worked diligently to enhance my style by experimenting with different sentence structures and improving my word choice. One significant improvement I have noticed is my ability to write persuasively. In the past, I struggled to support my arguments with strong evidence, but now, I conduct thorough research before writing and ensure that my points are well-supported. Additionally, I have become more mindful of grammatical errors. While I still make occasional mistakes, I have developed a habit of reviewing my work multiple times to correct them. Writing has become a tool for self-expression, and I am excited to continue refining my skills in the future."""
    ]
    progress_report = analyze_student_progress(sample_essays)
    print("Progress Report:", progress_report)
    common_mistakes = progress_report.get("common_mistakes", [])
    assignment = generate_assignment_questions(common_mistakes)
    print("Assignment Questions:", assignment)
    
    # Generate PDF and save to file
    pdf_blob = generate_assignment_pdf(assignment)
    with open("media/Writing_Assignment.pdf", "wb") as f:
        f.write(pdf_blob)
    print("PDF saved to media/Writing_Assignment.pdf")
