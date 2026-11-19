from typing import Optional, Literal
from pydantic import BaseModel
from app.schemas.decomposition import BacklogDecompositionResult


class JobMessage(BaseModel):
    job_id: str
    project_id: int
    file_path: str


class JobCallbackPayload(BaseModel):
    job_id: str
    project_id: int
    status: Literal["PENDING", "EXTRACTING_PDF", "RUNNING_LLM", "COMPLETED", "FAILED"]
    error_message: Optional[str] = None
    result: Optional[BacklogDecompositionResult] = None

