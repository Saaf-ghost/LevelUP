# BoostUP AI Service

Standalone FastAPI service reserved for future BoostUP AI capabilities. It is intentionally isolated from the core API so the core CRUD MVP can run without it.

This scaffold currently exposes only service health and OpenAPI documentation. Feature endpoints, domain services, and provider integrations can be added incrementally.

## Requirements

- Python 3.11+
- pip

## Local setup

```powershell
cd ai-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".[dev]"
Copy-Item .env.example .env
```

If PowerShell blocks activation, run the virtual environment's Python directly:

```powershell
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8090
```

## Run

```powershell
python -m uvicorn app.main:app --reload --port 8090
```

- API root: `http://localhost:8090/`
- Health: `http://localhost:8090/api/v1/health`
- Swagger UI: `http://localhost:8090/docs`
- ReDoc: `http://localhost:8090/redoc`

## Test

```powershell
python -m pytest
```

## Configuration

Settings are loaded from environment variables or a local `.env` file and use the `AI_SERVICE_` prefix.

| Variable | Default |
| :--- | :--- |
| `AI_SERVICE_APP_NAME` | `BoostUP AI Service` |
| `AI_SERVICE_ENVIRONMENT` | `development` |
| `AI_SERVICE_DEBUG` | `false` |
| `AI_SERVICE_HOST` | `0.0.0.0` |
| `AI_SERVICE_PORT` | `8090` |
| `AI_SERVICE_API_PREFIX` | `/api/v1` |
| `AI_SERVICE_CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` |

Do not commit `.env`.

## Structure

```text
app/
  main.py             FastAPI application factory and root endpoint
  api/
    router.py         Aggregates feature routers
    routes/
      health.py       Health endpoint
  core/
    config.py         Typed settings
  schemas/            Pydantic request/response models
  services/           Future application and domain services
tests/
  test_health.py
  test_config.py
```

## Adding a feature

1. Add request/response models under `app/schemas/`.
2. Add business logic under `app/services/`.
3. Add a router under `app/api/routes/`.
4. Register the router in `app/api/router.py`.
5. Add tests under `tests/`.

## Docker

```powershell
docker build -t boostup-ai-service .
docker run --rm -p 8090:8090 --env-file .env boostup-ai-service
```

The service is not started by the root `docker-compose.yml` yet.
