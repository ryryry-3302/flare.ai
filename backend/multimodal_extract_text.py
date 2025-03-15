from pdf_to_png import pdf_to_images
from transcribe_from_image import extract_text_from_images_with_prefix
import os

def extract_text(input_file):
    if input_file.endswith('.pdf'):
        # Convert PDF to images and save them in the same directory as the PDF
        image_files = pdf_to_images(input_file, output_folder="media", fmt="png", zoom=4.0)
        # Extract text from the images using the prefix (without file extension)
        prefix = os.path.splitext(os.path.basename(input_file))[0]
        results = extract_text_from_images_with_prefix(f"media/{prefix}")
    elif input_file.endswith(('.png', '.jpg', '.jpeg')):
        # Extract text from the image file using its prefix (without extension)
        prefix = os.path.splitext(os.path.basename(input_file))[0]
        directory = os.path.dirname(input_file)
        results = extract_text_from_images_with_prefix(f"{directory}/{prefix}" if directory else prefix)
    return results

if __name__ == "__main__":
    input_file = "media/Anchor - 6_page_1.png"  # Replace with your input file path
    results = extract_text(input_file)
    print("Extracted Text:")
    for text in results:
        print(text)
