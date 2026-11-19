# BoostUP

An agile delivery workspace for small teams — projects, a user-story backlog, sprint planning, a real-time Kanban board, team roles, delivery metrics, and AI-assisted backlog decomposition from a requirements document.

BoostUP is a modular monolith: a Spring Boot REST API owns the domain and persistence, a React single-page application provides the workspace, and an isolated Python service turns uploaded product documents into a structured backlog using a local LLM.

---

## Features

| Area | Capability |
| :--- | :--- |
| **Projects** | Create projects, manage owners and members, browse a project workspace |
| **Backlog** | Requirements tree with ordering, acceptance criteria and story points |
| **Sprints** | Sprint planning, lifecycle control, and single-active-sprint enforcement per project |
| **Kanban** | Drag-and-drop board with explicit task state transitions and status history |
| **Metrics** | Burndown, velocity, workload distribution, capacity and sprint health scoring |
| **Decisions** | Decision notes recorded against a project for delivery traceability |
| **AI decomposition** | Upload a PDF or Markdown requirements document and receive a generated requirement/task backlog |
| **Auth** | JWT bearer authentication with role-based and project-scoped authorization |

---

## Architecture

```text
                    ┌──────────────────────────────┐
                    │   React 19 SPA (Vite)        │
                    │   Tailwind · dnd-kit · Recharts │
                    └──────────────┬───────────────┘
                                   │ REST + JWT
                                   ▼
                    ┌──────────────────────────────┐        ┌───────────────┐
                    │   Spring Boot 3 REST API     │◄──────►│ PostgreSQL 16 │
                    │   Spring Security · JPA      │        └───────────────┘
                    └──────────────┬───────────────┘
                                   │ AMQP publish
                                   ▼
                    ┌──────────────────────────────┐
                    │   RabbitMQ (job queue)       │
                    └──────────────┬───────────────┘
                                   │ consume
                                   ▼
                    ┌──────────────────────────────┐        ┌───────────────┐
                    │   FastAPI AI Worker          │───────►│ Ollama (LLM)  │
                    │   PyMuPDF · EasyOCR          │        └───────────────┘
                    └──────────────┬───────────────┘
                                   │ job status callback
                                   ▼
                          Spring Boot API (job state)
```

**AI decomposition flow**

1. The user uploads a requirements document from the backlog panel.
2. The API creates a persisted `AIJob` in `PENDING` and publishes a message on the job queue.
3. The worker reports `EXTRACTING_PDF` while it extracts and OCRs the document, then `RUNNING_LLM` while Ollama decomposes the text.
4. The worker posts the resulting backlog back to the API, which stores the requirements and marks the job `COMPLETED` or `FAILED`.
5. The frontend polls the job status endpoint and reflects progress live in the UI.

Failed jobs are routed to a dead-letter queue so a single bad document cannot block the pipeline.

---

## Technology stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Java 17, Spring Boot 3.3, Spring Security, Spring Data JPA, JWT (jjwt), RabbitMQ (Spring AMQP), Maven |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4, dnd-kit, Recharts, axios, React Router |
| **AI service** | Python 3.11+, FastAPI, pika, PyMuPDF, EasyOCR, httpx |
| **Infrastructure** | PostgreSQL 16, RabbitMQ 3.13 (management), Ollama |
| **Testing** | JUnit 5 / Spring Boot Test, pytest |

---

## Repository layout

```text
backend/                  Spring Boot REST API
  src/main/java/com/boostup/
    controller/           REST endpoints
    dto/                  API request and response contracts
    model/                JPA entities
    repository/           Spring Data repositories
    security/             JWT filter, security config, project-scoped authorization
    service/              Domain services, metrics, task state machine, AI job orchestration
    config/               Messaging and application configuration
  src/test/               Backend test suite

frontend/                 React single-page application
  src/api/                HTTP client
  src/components/         Kanban board, AI upload modal, layout
  src/context/            Authentication and sprint state
  src/pages/              Landing, authentication, and workspace

ai-service/               Standalone FastAPI AI worker
  app/api/routes/         HTTP endpoints (health, direct PDF parse)
  app/services/           PDF extraction, Ollama client, RabbitMQ consumer
  app/schemas/            Pydantic models for jobs and decomposition
  app/worker.py           Queue consumer entry point

docker-compose.yml        PostgreSQL and RabbitMQ
run.bat                   One-click Windows launcher for the whole stack
RUN_INSTRUCTIONS.md       Detailed setup, ports and troubleshooting guide
```

---

## Prerequisites

| Tool | Version |
| :--- | :--- |
| Docker Desktop | Latest |
| JDK | 17 or 21 |
| Node.js / npm | 20+ / 10+ |
| Python | 3.11+ |
| Ollama | Latest |

Pull the decomposition model once:

```bash
ollama pull llama3.2:latest
```

---

## Quick start

### Windows one-click

```bat
run.bat
```

`run.bat` validates `.env`, starts Ollama in the background if needed, brings up PostgreSQL and RabbitMQ with Docker Compose, then launches the AI worker, the API and the frontend in separate Windows Terminal tabs.

### Manual

```bash
# 1. Environment
cp .env.example .env

# 2. Infrastructure
docker compose up -d

# 3. AI worker
cd ai-service
python -m venv .venv
.venv/Scripts/activate          # Linux/macOS: source .venv/bin/activate
pip install -e ".[dev]"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8090 --reload

# 4. Backend
cd backend
./mvnw spring-boot:run          # Windows: mvnw.cmd spring-boot:run

# 5. Frontend
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173> and sign in as the platform administrator with the credentials defined by `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` (the profile menu then exposes **Platform Administration**). Accounts created through the registration form are always regular users.

Administrators can create projects too: whoever creates a project is its **OWNER**, while invited accounts are **MEMBER** of that project. Project roles are independent of the platform role.

---

## Services and ports

| Service | URL | Credentials |
| :--- | :--- | :--- |
| Frontend | <http://localhost:5173> | Application login |
| Backend API | <http://localhost:8082> | JWT bearer token |
| AI worker API / docs | <http://localhost:8090/docs> | Internal |
| RabbitMQ management | <http://localhost:15672> | `boostup` / `boostup` |
| PostgreSQL | `localhost:55432` (database `boostup`) | `boostup` / `boostup` |
| Ollama | <http://localhost:11434> | None |

---

## Configuration

All runtime configuration is read from a root `.env` file, which is local-only and never committed. `.env.example` documents every supported variable with safe placeholders.

| Variable | Purpose |
| :--- | :--- |
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | PostgreSQL connection |
| `JWT_SECRET`, `JWT_EXPIRATION_SECONDS` | Token signing and lifetime |
| `CORS_ALLOWED_ORIGINS` | Permitted browser origins |
| `RABBITMQ_HOST`, `RABBITMQ_PORT`, `RABBITMQ_USERNAME`, `RABBITMQ_PASSWORD` | Message broker |
| `UPLOAD_DIR` | Temporary storage for uploaded documents |
| `AI_SERVICE_OLLAMA_BASE_URL`, `AI_SERVICE_OLLAMA_MODEL` | Local LLM endpoint and model |
| `VITE_API_BASE_URL` | Backend base URL used by the frontend, including the `/api` prefix |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FULL_NAME` | Platform administrator provisioned at startup; registration never grants this role |

> Replace `JWT_SECRET` and all database credentials before deploying anywhere shared. The defaults in `.env.example` are for local development only.

---

## Testing

```bash
# Backend
cd backend && ./mvnw test

# AI service
cd ai-service && python -m pytest tests

# Frontend production build
cd frontend && npm run build
```

---

## Documentation

- [RUN_INSTRUCTIONS.md](RUN_INSTRUCTIONS.md) — full setup, manual service startup, endpoints and troubleshooting
- [ai-service/README.md](ai-service/README.md) — AI worker configuration and extension points
- [frontend/README.md](frontend/README.md) — frontend tooling notes
