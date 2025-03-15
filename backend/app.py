from flask import Flask, request, jsonify, send_file, render_template, Response
from werkzeug.utils import secure_filename
import os
import time
import json
import uuid
from datetime import datetime
from queue import Queue
import threading
import socket
from flask_cors import CORS
import PIL.Image
from multimodal_extract_text import extract_text  # Use the unified extraction function

app = Flask(__name__)
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
        results = extract_text(filepath, notify_callback=notify_progress)
        
        # Combine all text results
        extracted_text = "\n\n".join(results) if results else ""
        
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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000, threaded=True)