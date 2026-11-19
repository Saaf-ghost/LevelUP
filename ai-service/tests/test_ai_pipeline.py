import pymupdf as fitz
import pytest
from app.schemas.decomposition import (
    BacklogDecompositionResult,
    RequirementItem,
    UserStoryItem,
    TaskItem,
)
from app.schemas.job import JobMessage, JobCallbackPayload
from app.services.pdf_extractor import extract_text_from_pdf


def test_schema_validation_success():
    raw_payload = {
        "document_summary": "E-Commerce Backlog",
        "requirements": [
            {
                "id": "REQ-01",
                "title": "User Authentication",
                "description": "Secure sign-in with JWT",
                "category": "Security",
                "user_stories": [
                    {
                        "title": "As a user I want to log in securely",
                        "user_role": "Customer",
                        "action": "log in with email and password",
                        "benefit": "access my dashboard",
                        "acceptance_criteria": [
                            "Given valid credentials When submitting form Then return JWT token"
                        ],
                        "tasks": [
                            {
                                "title": "Create auth endpoint",
                                "description": "Spring Boot REST controller",
                                "effort_points": 5,
                                "estimated_hours": 6,
                                "priority": "HIGH"
                            }
                        ]
                    }
                ]
            }
        ]
    }

    result = BacklogDecompositionResult.model_validate(raw_payload)
    assert len(result.requirements) == 1
    req = result.requirements[0]
    assert req.id == "REQ-01"
    assert len(req.user_stories) == 1
    story = req.user_stories[0]
    assert len(story.tasks) == 1
    assert story.tasks[0].effort_points == 5


def test_job_callback_payload():
    payload = JobCallbackPayload(
        job_id="test-job-123",
        project_id=42,
        status="EXTRACTING_PDF"
    )
    dumped = payload.model_dump()
    assert dumped["job_id"] == "test-job-123"
    assert dumped["project_id"] == 42
    assert dumped["status"] == "EXTRACTING_PDF"


def test_pdf_extraction_with_pymupdf(tmp_path):
    # Create a small valid PDF using PyMuPDF
    pdf_path = str(tmp_path / "test_doc.pdf")
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), "BoostUP Agile Project Management: Feature Specifications and User Stories")
    doc.save(pdf_path)
    doc.close()

    result = extract_text_from_pdf(pdf_path)
    assert result.total_pages == 1
    assert "BoostUP Agile Project Management" in result.full_text
