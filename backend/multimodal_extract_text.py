from pdf_to_png import pdf_to_images
from transcribe_from_image import extract_text_from_image
import os
import tempfile
import shutil
import re

def clean_extracted_text(text):
    """Clean and normalize extracted text for better paragraphing"""
    if not text:
        return text
        
    # Replace multiple spaces with single space
    text = re.sub(r' +', ' ', text)
    
    # Normalize line endings
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    
    # Fix sentences split across lines (where a line ends without punctuation)
    # This joins sentences that were broken in the middle
    lines = text.split('\n')
    merged_lines = []
    current_line = ""
    
    for line in lines:
        stripped_line = line.strip()
        # If previous line doesn't end with sentence-ending punctuation, join with current
        if current_line and not re.search(r'[.!?:"]$', current_line):
            current_line += " " + stripped_line
        else:
            if current_line:  # Add completed sentence to results
                merged_lines.append(current_line)
            current_line = stripped_line
    
    # Add the last line if there's content
    if current_line:
        merged_lines.append(current_line)
    
    # Rejoin with single newlines
    text = '\n'.join(merged_lines)
    
    # Replace triple+ newlines with double newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    # Ensure paragraphs are properly separated
    paragraphs = [p.strip() for p in text.split('\n\n')]
    paragraphs = [p for p in paragraphs if p]
    
    # Join with proper paragraph separation
    return '\n\n'.join(paragraphs)

def extract_text(input_file, notify_callback=None):
    """
    Extract text from either PDF or image files
    
    Args:
        input_file (str): Path to the input file (PDF or image)
        notify_callback (function, optional): Callback for progress updates
    
    Returns:
        list: List of extracted text strings
    """
    results = []

    try:
        if input_file.endswith('.pdf'):
            # Create a temporary directory for the images
            with tempfile.TemporaryDirectory() as temp_dir:
                # Convert PDF to images
                if notify_callback:
                    notify_callback({'status': 'processing', 'message': 'Converting PDF to images...'})
                
                image_files = pdf_to_images(input_file, output_folder=temp_dir)
                
                # Extract text from each image
                for i, img_path in enumerate(image_files):
                    if notify_callback:
                        notify_callback({
                            'status': 'processing', 
                            'message': f'Processing page {i+1} of {len(image_files)}...'
                        })
                    
                    # Use the single image extraction function directly
                    text = extract_text_from_image(img_path)
                    if text:
                        # Clean text before adding to results
                        results.append(clean_extracted_text(text))
        
        elif input_file.endswith(('.png', '.jpg', '.jpeg')):
            # For a single image, just extract text directly
            if notify_callback:
                notify_callback({'status': 'processing', 'message': 'Extracting text from image...'})
            
            text = extract_text_from_image(input_file)
            if text:
                # Clean text before adding to results
                results.append(clean_extracted_text(text))
        else:
            raise ValueError(f"Unsupported file format: {input_file}")
    
    except Exception as e:
        if notify_callback:
            notify_callback({'status': 'error', 'message': f'Error extracting text: {str(e)}'})
        raise e
    
    return results

if __name__ == "__main__":
    input_file = "media/sample.pdf"  # Replace with your input file path
    results = extract_text(input_file)
    print("Extracted Text:")
    for text in results:
        print(text)
