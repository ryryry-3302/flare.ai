import fitz
from pathlib import Path

def pdf_to_images(pdf_path, output_folder="media", fmt="png", zoom=4.0):
    """
    Convert PDF to high-resolution images using PyMuPDF (fitz).
    
    :param pdf_path: Path to the input PDF file.
    :param output_folder: Folder to save the images.
    :param fmt: Image format ('png', 'jpeg', etc.).
    :param zoom: Scaling factor to increase resolution (e.g., 2.0 = 200% resolution).
    :return: List of image file paths.
    """
    pdf_path = Path(pdf_path)
    output_folder = Path(output_folder)
    output_folder.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(pdf_path)
    image_paths = []

    for i, page in enumerate(doc):
        # Increase resolution by applying a matrix scaling
        mat = fitz.Matrix(zoom, zoom)  # Scale both width & height
        pix = page.get_pixmap(matrix=mat)

        image_path = output_folder / f"{pdf_path.stem}_page_{i+1}.{fmt}"
        pix.save(str(image_path))
        image_paths.append(str(image_path))

    return image_paths

# Example usage:
image_files = pdf_to_images("media\Anchor - 6.pdf")
print(image_files)
