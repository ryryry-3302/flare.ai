from flask import Flask, request, jsonify, send_file, render_template, Response
from werkzeug.utils import secure_filename
import os
import time
import json
import uuid
import base64
from datetime import datetime
from queue import Queue
import threading
import socket
from flask_cors import CORS
import PIL.Image
from multimodal_extract_text import extract_text, clean_extracted_text  # Use the unified extraction function
from scorer import grade_essay
from grammar import corrections_from_essay
from analyse_history import analyze_student_progress, generate_assignment_questions, generate_assignment_pdf
import logging
from supabase_functions import get_supabase_client

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='static', static_url_path='/static')
CORS(app)  # This enables CORS for all routes

# Configure upload settings
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

# Store active sessions and their message queues
sessions = {}

# Lock for thread-safe session management
session_lock = threading.Lock()

class MessageAnnouncer:
    def __init__(self):
        self.listeners = []
        
    def listen(self):
        q = Queue(maxsize=5)
        self.listeners.append(q)
        return q
        
    def announce(self, msg):
        # Don't block when listeners can't keep up
        for i in reversed(range(len(self.listeners))):
            try:
                self.listeners[i].put_nowait(msg)
            except:
                del self.listeners[i]

# Unified handler for both image and PDF uploads
def handle_document_upload(session_id, file, is_pdf=False):
    try:
        # Create session directory if it doesn't exist
        session_dir = os.path.join(app.config['UPLOAD_FOLDER'], session_id)
        os.makedirs(session_dir, exist_ok=True)
        
        # Save file with unique name
        timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
        filename = f"{timestamp}-{secure_filename(file.filename)}"
        filepath = os.path.join(session_dir, filename)
        file.save(filepath)
        
        # Create a notification callback for this session
        def notify_progress(data):
            notify_clients(session_id, data)
            
        # Extract text using multimodal_extract_text with progress notifications
        text_results = extract_text(filepath, notify_callback=notify_progress)
        
        # Process text results based on document type
        if is_pdf and len(text_results) > 1:
            # For multi-page PDFs, add page markers and join with extra spacing
            processed_results = []
            for i, page_text in enumerate(text_results):
                cleaned_text = clean_extracted_text(page_text)
                if i > 0:
                    processed_results.append(f"\n\n--- Page {i+1} ---\n\n{cleaned_text}")
                else:
                    processed_results.append(cleaned_text)
            extracted_text = "\n\n".join(processed_results)
        else:
            # For single images or single-page PDFs, just clean the text
            extracted_text = "\n\n".join([clean_extracted_text(text) for text in text_results]) if text_results else ""
        
        # Notify clients that file is processed
        notify_clients(session_id, {
            'status': 'success',
            'filename': filename,
            'extractedText': extracted_text
        })
        
        return {
            'success': True,
            'fileInfo': {
                'filename': filename,
                'size': os.path.getsize(filepath),
                'path': filepath
            },
            'extractedText': extracted_text
        }
    except Exception as e:
        error_msg = f"Error processing {'PDF' if is_pdf else 'image'}: {str(e)}"
        print(error_msg)
        notify_clients(session_id, {'status': 'error', 'message': error_msg})
        return {'error': error_msg}, 500

@app.route('/api/upload/<session_id>', methods=['POST'])
def upload_file(session_id):
    if 'file' not in request.files:
        notify_clients(session_id, {'status': 'error', 'message': 'No file part'})
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        notify_clients(session_id, {'status': 'error', 'message': 'No selected file'})
        return jsonify({'error': 'No selected file'}), 400
    
    if file and file.filename.lower().endswith(('.jpg', '.jpeg', '.png')):
        result = handle_document_upload(session_id, file, is_pdf=False)
        if isinstance(result, tuple):  # Error case
            return jsonify(result[0]), result[1]
        return jsonify(result)
    else:
        notify_clients(session_id, {'status': 'error', 'message': 'Invalid image format'})
        return jsonify({'error': 'Invalid image format'}), 400

@app.route('/api/upload-pdf/<session_id>', methods=['POST'])
def upload_pdf(session_id):
    if 'file' not in request.files:
        notify_clients(session_id, {'status': 'error', 'message': 'No file part'})
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        notify_clients(session_id, {'status': 'error', 'message': 'No selected file'})
        return jsonify({'error': 'No selected file'}), 400
    
    if file and file.filename.lower().endswith('.pdf'):
        result = handle_document_upload(session_id, file, is_pdf=True)
        if isinstance(result, tuple):  # Error case
            return jsonify(result[0]), result[1]
        return jsonify(result)
    else:
        notify_clients(session_id, {'status': 'error', 'message': 'Invalid PDF format'})
        return jsonify({'error': 'Invalid PDF format'}), 400

@app.route('/api/upload-status/<session_id>')
def upload_status(session_id):
    def stream():
        with session_lock:
            if session_id not in sessions:
                sessions[session_id] = MessageAnnouncer()
        
        messages = sessions[session_id].listen()
        
        # Send initial status
        yield f"data: {json.dumps({'status': 'waiting'})}\n\n"
        
        # Then stream updates
        while True:
            try:
                msg = messages.get()  # Blocks until a message is available
                yield f"data: {json.dumps(msg)}\n\n"
            except Exception as e:
                print(f"Error sending SSE update: {str(e)}")
                yield f"data: {json.dumps({'status': 'error', 'message': 'Server error'})}\n\n"
                break
    
    return Response(stream(), mimetype="text/event-stream")

@app.route('/api/uploaded-file/<session_id>')
def get_uploaded_file(session_id):
    session_dir = os.path.join(app.config['UPLOAD_FOLDER'], session_id)
    
    if not os.path.exists(session_dir):
        return jsonify({'error': 'File not found'}), 404
    
    # Get the most recent file in the directory
    files = os.listdir(session_dir)
    if not files:
        return jsonify({'error': 'No files uploaded'}), 404
    
    # Sort by modified time and get latest
    files.sort(key=lambda f: os.path.getmtime(os.path.join(session_dir, f)), reverse=True)
    latest_file = files[0]
    
    return send_file(os.path.join(session_dir, latest_file))

@app.route('/upload/<session_id>')
def upload_page(session_id):
    """Mobile-friendly upload page that appears when QR code is scanned"""
    return render_template('upload.html', session_id=session_id)

@app.route('/api/get-ip')
def get_ip():
    # Get local IP address
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # doesn't have to be reachable
        s.connect(('10.255.255.255', 1))
        local_ip = s.getsockname()[0]
    except Exception:
        local_ip = '127.0.0.1'
    finally:
        s.close()
    return jsonify({'ip': local_ip})

@app.after_request
def after_request(response):
    header = response.headers
    header['Access-Control-Allow-Origin'] = '*'
    header['Access-Control-Allow-Headers'] = '*'
    header['Access-Control-Allow-Methods'] = '*'
    return response

def notify_clients(session_id, data):
    """Send SSE data to all clients for a given session"""
    with session_lock:
        if session_id in sessions:
            sessions[session_id].announce(data)

@app.route('/api/analyze-essay', methods=['POST'])
def analyze_essay():
    """Analyze essay text and return detailed scoring metrics"""
    logger.info("Received essay analysis request")
    
    try:
        data = request.json
        if not data or 'essay' not in data:
            logger.error("No essay text provided in request")
            return jsonify({'error': 'No essay text provided'}), 400
            
        essay_text = data['essay']
        logger.info(f"Essay length: {len(essay_text)} characters")
        logger.debug(f"Essay preview: {essay_text[:100]}...")
        
        if not essay_text or len(essay_text.strip()) < 10:
            logger.error("Essay text too short")
            return jsonify({'error': 'Essay text is too short'}), 400
            
        # Call the grading function
        logger.info("Calling grade_essay function")
        analysis_result = grade_essay(essay_text)
        
        logger.info("Analysis completed")
        logger.debug(f"Analysis result: {analysis_result}")
        
        # If the result is a string (like JSON string), parse it
        if isinstance(analysis_result, str):
            import json
            try:
                analysis_result = json.loads(analysis_result)
                logger.debug("Successfully parsed string result as JSON")
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse analysis result as JSON: {e}")
                # If not valid JSON, return as is
                pass
                
        response_data = {
            'success': True,
            'analysis': analysis_result
        }
        
        logger.info("Sending successful response")
        logger.debug(f"Response data: {response_data}")
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.exception("Error processing essay analysis")
        return jsonify({'error': str(e)}), 500

@app.route('/api/list-essays', methods=['GET'])
def list_essays():
    """List all essays from Supabase"""
    try:
        logger.info("Fetching essays from Supabase")
        supabase = get_supabase_client()
        
        # Get all essays, including the essay_body content
        response = supabase.table("Essays").select("*").execute()
        
        if not response.data:
            logger.info("No essays found in database")
            return jsonify([])
            
        # Format the response to include any necessary fields
        essays = response.data
        logger.info(f"Found {len(essays)} essays")
        
        return jsonify(essays)
        
    except Exception as e:
        logger.exception("Error fetching essays from Supabase")
        return jsonify({'error': str(e)}), 500
# Add this new route for writing style superhero recommendations

@app.route('/api/writing-style', methods=['POST'])
def analyze_writing_style():
    """Analyze essay text and recommend a writing style superhero"""
    logger.info("Received writing style analysis request")
    
    try:
        data = request.json
        if not data or 'essay' not in data:
            logger.error("No essay text provided in request")
            return jsonify({'error': 'No essay text provided'}), 400
            
        essay_text = data['essay']
        logger.info(f"Essay length: {len(essay_text)} characters")
        
        if not essay_text or len(essay_text.strip()) < 50:
            logger.error("Essay text too short")
            return jsonify({'error': 'Essay text is too short for style analysis'}), 400
            
        # Analyze the writing style
        style_hero = determine_writing_style_hero(essay_text)
        
        response_data = {
            'success': True,
            'hero': style_hero
        }
        
        logger.info(f"Writing style hero determined: {style_hero['name']}")
        return jsonify(response_data)
        
    except Exception as e:
        logger.exception("Error analyzing writing style")
        return jsonify({'error': str(e)}), 500

def determine_writing_style_hero(essay_text):
    """
    Analyze essay text and determine which writing style superhero best matches.
    
    Returns a dictionary with hero details.
    """
    import re
    from collections import Counter
    import random
    
    # Extract basic text features
    sentences = re.split(r'[.!?]+', essay_text)
    sentences = [s.strip() for s in sentences if s.strip()]
    
    words = essay_text.lower().split()
    unique_words = set(words)
    
    # Calculate basic metrics
    avg_sentence_length = sum(len(s.split()) for s in sentences) / max(len(sentences), 1)
    vocabulary_richness = len(unique_words) / max(len(words), 1)
    
    # Look for descriptive words
    descriptive_words = ['beautiful', 'amazing', 'wonderful', 'incredible', 'stunning', 
                        'gorgeous', 'fascinating', 'lovely', 'colorful', 'vivid', 'bright',
                        'brilliant', 'magnificent', 'fantastic', 'extraordinary']
    
    descriptive_count = sum(1 for word in words if word in descriptive_words)
    descriptive_ratio = descriptive_count / max(len(words), 1)
    
    # Look for complex sentence structures
    complex_indicators = [', which', ', where', ', when', ', who', ', because', 
                        '; however', '; therefore', ', though', ', although', ', yet']
    
    complex_count = sum(1 for indicator in complex_indicators if indicator in essay_text.lower())
    complex_ratio = complex_count / max(len(sentences), 1)
    
    # Check for active voice vs passive voice
    passive_indicators = [' is ', ' are ', ' was ', ' were ', ' be ', ' been ']
    passive_count = sum(essay_text.lower().count(indicator) for indicator in passive_indicators)
    passive_ratio = passive_count / max(len(sentences), 1)
    
    # Define our superheroes
    heroes = [
        {
            "name": "Captain Clarity",
            "description": "The master of crystal-clear communication! With your laser-focus powers, you can explain the most complicated ideas so anyone can understand them.",
            "strengths": ["Clear communication", "Concise expression", "Logical organization"],
            "tips": [
                "Keep sharpening your clarity by using concrete examples",
                "Try adding more sophisticated transitions between ideas",
                "Challenge yourself with more complex vocabulary while maintaining clarity"
            ],
            "icon": "🔍"
        },
        {
            "name": "Vocabulary Vanguard",
            "description": "The word wizard extraordinaire! You command an army of impressive words and craft sentences that flow like magic spells.",
            "strengths": ["Rich vocabulary", "Complex sentence structures", "Elegant expression"],
            "tips": [
                "Ensure your sophisticated style doesn't sacrifice clarity",
                "Vary sentence length to create rhythm in your writing",
                "Continue expanding your vocabulary in your specific domain"
            ],
            "icon": "📚"
        },
        {
            "name": "Imagination Igniter",
            "description": "The creative flame-thrower! Your words paint vivid mind-pictures that transport readers to new worlds and fresh perspectives.",
            "strengths": ["Creative expression", "Vivid descriptions", "Engaging imagery"],
            "tips": [
                "Ensure metaphors enhance rather than obscure your message",
                "Practice using similes and analogies to explain complex concepts",
                "Balance creativity with structure for maximum impact"
            ],
            "icon": "🎨"
        },
        {
            "name": "Reason Ranger",
            "description": "The thought detective! You build rock-solid arguments that stand strong against any challenge, using evidence and clever thinking.",
            "strengths": ["Logical reasoning", "Evidence-based writing", "Structured arguments"],
            "tips": [
                "Consider adding more emotional appeal to balance your logical approach",
                "Use stories and examples to make your logical points more memorable",
                "Practice varying your sentence structure for better engagement"
            ],
            "icon": "⚖️"
        },
        {
            "name": "Authentic Avenger",
            "description": "The genuine connection creator! Your true personality shines through your words, making readers feel like they've made a new friend.",
            "strengths": ["Distinctive voice", "Authentic expression", "Reader engagement"],
            "tips": [
                "Maintain your voice while adapting to different writing contexts",
                "Continue developing technical skills to support your strong voice",
                "Study writers you admire to add new dimensions to your voice"
            ],
            "icon": "🎭"
        }
    ]
    
    # Determine hero based on text features
    scores = {
        "Captain Clarity": 0,
        "Vocabulary Vanguard": 0, # Changed from "Professor Prose"
        "Imagination Igniter": 0, # Changed from "Metaphor Master"
        "Reason Ranger": 0,       # Changed from "Logic Launcher"
        "Authentic Avenger": 0    # Changed from "Voice Virtuoso"
    }
    
    # Captain Clarity tends to have medium-length sentences, good organization
    if 12 <= avg_sentence_length <= 20:
        scores["Captain Clarity"] += 2
    
    # Vocabulary Vanguard uses complex sentences and rich vocabulary
    if avg_sentence_length > 20:
        scores["Vocabulary Vanguard"] += 2
    if vocabulary_richness > 0.6:
        scores["Vocabulary Vanguard"] += 2
    if complex_ratio > 0.3:
        scores["Vocabulary Vanguard"] += 1
        
    # Imagination Igniter uses descriptive language
    if descriptive_ratio > 0.05:
        scores["Imagination Igniter"] += 3
    
    # Reason Ranger uses structured arguments, often with specific connectors
    if any(x in essay_text.lower() for x in ['therefore', 'thus', 'consequently', 'as a result']):
        scores["Reason Ranger"] += 2
    if any(x in essay_text.lower() for x in ['first', 'second', 'third', 'finally', 'in conclusion']):
        scores["Reason Ranger"] += 2
        
    # Authentic Avenger has a distinctive voice, often with first person or direct address
    if essay_text.lower().count("i ") > len(sentences) * 0.2:
        scores["Authentic Avenger"] += 2
    if essay_text.lower().count("you ") > len(sentences) * 0.1:
        scores["Authentic Avenger"] += 2
        
    # Get the hero with highest score (or random among ties)
    max_score = max(scores.values())
    top_heroes = [hero for hero, score in scores.items() if score == max_score]
    chosen_hero_name = random.choice(top_heroes)
    
    # Find the full hero data
    chosen_hero = next(hero for hero in heroes if hero["name"] == chosen_hero_name)
    
    return chosen_hero

@app.route('/api/grammar-check', methods=['POST'])
def grammar_check():
    """Check essay text for grammar, punctuation, and spelling errors"""
    logger.info("Received grammar check request")
    
    try:
        data = request.json
        if not data or 'essay' not in data:
            logger.error("No essay text provided in request")
            return jsonify({'error': 'No essay text provided'}), 400
            
        essay_text = data['essay']
        logger.info(f"Essay length: {len(essay_text)} characters")
        logger.debug(f"Essay preview: {essay_text[:100]}...")
        
        if not essay_text or len(essay_text.strip()) < 10:
            logger.error("Essay text too short")
            return jsonify({'error': 'Essay text is too short'}), 400
            
        # Call the grammar correction function
        logger.info("Calling corrections_from_essay function")
        corrections = corrections_from_essay(essay_text)
        
        logger.info("Grammar check completed")
        logger.debug(f"Corrections: {corrections}")
        
        response_data = {
            'success': True,
            'corrections': corrections
        }
        
        logger.info("Sending successful response")
        logger.debug(f"Response data: {response_data}")
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.exception("Error processing grammar check")
        return jsonify({'error': str(e)}), 500

@app.route('/api/student-progress', methods=['GET'])
def student_progress():
    """Analyze student essays to track progress and generate a personalized assignment PDF"""
    logger.info("Received student progress analysis request")
    
    try:
        supabase = get_supabase_client()
        # Replace "essays" with your actual table name
        supa_response = supabase.table("Essays").select("*").execute()
        data = supa_response.data

        essays = []
        for item in data:
            essays.append(item['essay_body'])

        if not isinstance(essays, list) or len(essays) == 0:
            logger.error("Essays must be provided as a non-empty list")
            return jsonify({'error': 'Essays must be provided as a non-empty list'}), 400
        
        logger.info(f"Analyzing progress for {len(essays)} essays")
        
        # Analyze student progress
        progress = analyze_student_progress(essays)
        logger.info("Progress analysis completed")
        
        # Extract common mistakes and improvements separately
        common_mistakes = progress.get("common_mistakes", [])
        improvements = progress.get("improvements", [])
        
        # Generate assignment questions based on common mistakes
        assignment = generate_assignment_questions(common_mistakes)
        logger.info("Assignment questions generated")
        
        # Generate PDF
        pdf_blob = generate_assignment_pdf(assignment)
        logger.info("Assignment PDF generated")
        
        # Encode PDF as base64 for JSON response
        pdf_base64 = base64.b64encode(pdf_blob).decode('utf-8')
        
        response_data = {
            'success': True,
            'common_mistakes': common_mistakes,
            'improvements': improvements,
            'pdf': pdf_base64
        }
        
        logger.info("Sending successful response with progress data and PDF")
        return jsonify(response_data)
        
    except Exception as e:
        logger.exception("Error processing student progress analysis")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting Flask server")

    with app.app_context():  # Ensure proper application context
        response = student_progress()  # Call the function
       
        # Extract the JSON response properly
        if isinstance(response, tuple):  # Handle (response, status_code) case
            response, _ = response
        
        if isinstance(response, Response):  # Flask Response object case
            response_data = response.get_json()  # Get JSON data
            print(json.dumps(response_data, indent=2))  # Pretty print for readability
        else:
            print("Unexpected response format:", response)

    app.run(debug=True, host='0.0.0.0', port=5000, threaded=True)
