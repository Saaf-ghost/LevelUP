import os
import tempfile
import logging
from fastapi import APIRouter, File, UploadFile, HTTPException
from app.schemas.decomposition import BacklogDecompositionResult
from app.services.pdf_extractor import extract_text_from_pdf
from app.services.ollama_service import decompose_prd

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/parse", tags=["parse"])


@router.post("/pdf", response_model=BacklogDecompositionResult)
async def parse_and_decompose_pdf(file: UploadFile = File(...)):
    """
    Direct synchronous test endpoint: Uploads a PDF, extracts text (PyMuPDF + EasyOCR),
    and decomposes it via Ollama.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            content = await file.read()
            tmp.write(content)
            temp_path = tmp.name

        logger.info(f"Extracting PDF text from temp file: {temp_path}")
        extraction = extract_text_from_pdf(temp_path)
        logger.info(f"Running Ollama decomposition on extracted text ({len(extraction.full_text)} chars)...")
        result = await decompose_prd(extraction.full_text)
        return result
    except Exception as exc:
        logger.error(f"Error in direct PDF parse: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

