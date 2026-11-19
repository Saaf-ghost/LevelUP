import io
import logging
from typing import List
from PIL import Image
import numpy as np

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Lazy initialization of EasyOCR reader to avoid startup overhead
_easyocr_reader = None


def get_ocr_reader():
    global _easyocr_reader
    if _easyocr_reader is None:
        try:
            import easyocr
            settings = get_settings()
            logger.info(f"Initializing EasyOCR reader with languages: {settings.ocr_lang_list}")
            _easyocr_reader = easyocr.Reader(settings.ocr_lang_list, gpu=False)
        except Exception as err:
            logger.error(f"Failed to initialize EasyOCR: {err}")
            raise
    return _easyocr_reader


class PDFExtractionResult:
    def __init__(self, full_text: str, total_pages: int, ocr_pages_count: int):
        self.full_text = full_text
        self.total_pages = total_pages
        self.ocr_pages_count = ocr_pages_count


def extract_text_from_pdf(file_path: str) -> PDFExtractionResult:
    """
    Extracts text from a PDF file using PyMuPDF (fitz).
    If a page's extracted character count is below the configured threshold (e.g. scanned page),
    it automatically renders the page into an image and invokes EasyOCR.
    """
    import pymupdf as fitz

    settings = get_settings()
    doc = fitz.open(file_path)
    total_pages = len(doc)
    extracted_pages: List[str] = []
    ocr_pages_count = 0

    logger.info(f"Opening PDF '{file_path}' containing {total_pages} pages.")

    for page_idx in range(total_pages):
        page = doc.load_page(page_idx)
        raw_text = page.get_text("text").strip()

        # Check if text is sparse or empty (indicating a scanned or image page)
        if len(raw_text) < settings.min_chars_per_page_threshold:
            logger.warning(
                f"Page {page_idx + 1}/{total_pages} yielded sparse text ({len(raw_text)} chars). "
                f"Triggering EasyOCR fallback..."
            )
            try:
                # Render page to high-res image (2x zoom matrix for OCR accuracy)
                zoom_matrix = fitz.Matrix(2.0, 2.0)
                pix = page.get_pixmap(matrix=zoom_matrix)
                image_bytes = pix.tobytes("png")
                image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
                np_img = np.array(image)

                reader = get_ocr_reader()
                ocr_results = reader.readtext(np_img, detail=0)
                ocr_text = "\n".join(ocr_results).strip()

                page_content = f"--- [Page {page_idx + 1} (OCR Extracted)] ---\n{ocr_text}"
                ocr_pages_count += 1
            except Exception as ocr_err:
                logger.error(f"EasyOCR failed on page {page_idx + 1}: {ocr_err}")
                page_content = f"--- [Page {page_idx + 1} (Raw Fallback)] ---\n{raw_text}"
        else:
            page_content = f"--- [Page {page_idx + 1}] ---\n{raw_text}"

        extracted_pages.append(page_content)

    doc.close()
    full_text = "\n\n".join(extracted_pages)
    logger.info(
        f"Extraction complete for '{file_path}': {total_pages} pages total, "
        f"{ocr_pages_count} pages processed via EasyOCR."
    )
    return PDFExtractionResult(
        full_text=full_text,
        total_pages=total_pages,
        ocr_pages_count=ocr_pages_count
    )
