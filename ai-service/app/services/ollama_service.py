import json
import logging
import httpx
from app.core.config import get_settings
from app.schemas.decomposition import BacklogDecompositionResult

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert Agile Product Owner and Principal Software Architect.
Your task is to analyze the provided Product Requirements Document (PRD) or project specification,
and decompose it into a clean, actionable Agile Backlog.

You MUST respond strictly with valid JSON conforming to this structure:
{
  "document_summary": "High-level overview of the document",
  "requirements": [
    {
      "id": "REQ-1",
      "title": "Short title of the requirement",
      "description": "Functional description",
      "category": "Functional",
      "user_stories": [
        {
          "title": "As a [role], I want [feature], so that [benefit]",
          "user_role": "[role]",
          "action": "[action]",
          "benefit": "[benefit]",
          "acceptance_criteria": [
            "Given [precondition], When [action], Then [expected result]"
          ],
          "tasks": [
            {
              "title": "Technical subtask name",
              "description": "Implementation specifics",
              "effort_points": 3,
              "estimated_hours": 4,
              "priority": "MEDIUM"
            }
          ]
        }
      ]
    }
  ]
}

Guidelines:
1. Ensure every User Story has at least one concrete acceptance criteria written in Given/When/Then format.
2. Break each story down into 2-5 technical tasks (Frontend, Backend, Database, Testing).
3. Use standard Fibonacci numbers for effort_points: 1, 2, 3, 5, 8, or 13.
4. Output raw JSON only. Do NOT wrap in markdown fences or include explanatory text.
"""


async def decompose_prd(text: str) -> BacklogDecompositionResult:
    """
    Sends the extracted PDF text to local Ollama with format="json".
    Parses and validates the response against BacklogDecompositionResult.
    """
    settings = get_settings()
    endpoint = f"{settings.ollama_base_url.rstrip('/')}/api/generate"

    # Truncate text if excessively long to fit local context window safely
    max_context_chars = 32000
    cleaned_text = text[:max_context_chars]

    user_prompt = (
        f"Product Requirements Specification:\n\n"
        f"{cleaned_text}\n\n"
        f"Decompose this document into structured Requirements, User Stories, and Technical Tasks."
    )

    payload = {
        "model": settings.ollama_model,
        "prompt": f"{SYSTEM_PROMPT}\n\n{user_prompt}",
        "format": "json",
        "stream": False,
        "options": {
            "temperature": 0.2,
            "top_p": 0.9,
            "num_ctx": 8192,
        },
    }

    logger.info(f"Sending decomposition prompt to Ollama ({settings.ollama_model}) at {endpoint}...")
    async with httpx.AsyncClient(timeout=settings.ollama_timeout_seconds) as client:
        try:
            response = await client.post(endpoint, json=payload)
            response.raise_for_status()
        except httpx.HTTPError as exc:
            logger.error(f"Failed to communicate with Ollama at {endpoint}: {exc}")
            raise RuntimeError(f"Ollama inference error: {exc}") from exc

    raw_data = response.json()
    model_response_str = raw_data.get("response", "").strip()

    if not model_response_str:
        raise ValueError("Ollama returned an empty response body.")

    # Strip any stray markdown codeblock wrappers if present
    if model_response_str.startswith("```json"):
        model_response_str = model_response_str[7:]
    if model_response_str.startswith("```"):
        model_response_str = model_response_str[3:]
    if model_response_str.endswith("```"):
        model_response_str = model_response_str[:-3]
    model_response_str = model_response_str.strip()

    try:
        parsed_json = json.loads(model_response_str)
        validated_result = BacklogDecompositionResult.model_validate(parsed_json)
        logger.info(
            f"Successfully decomposed backlog: {len(validated_result.requirements)} requirements extracted."
        )
        return validated_result
    except Exception as err:
        logger.error(
            f"Failed to parse or validate Ollama JSON response: {err}\n"
            f"Response was:\n{model_response_str}"
        )
        raise ValueError(f"Malformed LLM JSON output: {err}") from err

