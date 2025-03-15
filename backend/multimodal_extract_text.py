from pdf_to_png import pdf_to_images
from transcribe_from_image import extract_text_from_image
import os
import tempfile
import shutil

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
                        results.append(text)
        
        elif input_file.endswith(('.png', '.jpg', '.jpeg')):
            # For a single image, just extract text directly
            if notify_callback:
                notify_callback({'status': 'processing', 'message': 'Extracting text from image...'})
            
            text = extract_text_from_image(input_file)
            if text:
                results.append(text)
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
