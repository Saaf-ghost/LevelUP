# Running BoostUP

BoostUP is an agile delivery platform powered by a Spring Boot 3 REST API, a Vite + React frontend, PostgreSQL, RabbitMQ, and a Python FastAPI AI worker running local LLM backlog decomposition via Ollama.

---

## ⚡ 1-Click Automated Start (`run.bat`)

On Windows, you can start the entire stack with a single double-click on:

```text
run.bat
```

Or from your command prompt:

```cmd
run.bat
```

### What `run.bat` does automatically:
1. **Validates `.env`**: Automatically creates `.env` from `.env.example` if it does not already exist.
2. **Checks Ollama in the Background**: Detects if Ollama's background service is running on `http://localhost:11434`. If it isn't running, it launches `ollama serve` silently in the background (no manual terminal interaction needed).
3. **Launches Tabbed Environment**: Uses Windows Terminal (`wt.exe`) to spin up 4 organized tabs (or individual labeled CMD windows if Windows Terminal is not installed):
   * **Tab 1 — Docker Infrastructure**: Runs `docker compose up` for PostgreSQL 16 (port `55432`) and RabbitMQ 3 Management (ports `5672` & `15672`).
   * **Tab 2 — AI Worker Service**: Activates the Python virtual environment and launches FastAPI + RabbitMQ AMQP consumer on port `8090`.
   * **Tab 3 — Backend Service**: Launches Spring Boot 3 API with `mvnw.cmd spring-boot:run` on port `8082`.
   * **Tab 4 — Frontend Web**: Launches Vite React SPA with `npm run dev` on port `5173`.

---

## Prerequisites

Before starting, ensure the following are installed on your machine:

| Tool | Recommended Version | Purpose |
| :--- | :--- | :--- |
| **Docker & Docker Compose** | Latest (Docker Desktop) | PostgreSQL & RabbitMQ message broker |
| **Java Development Kit (JDK)** | 17 or 21 | Spring Boot 3 Backend |
| **Node.js & npm** | Node 20+ & npm 10+ | React SPA Frontend |
| **Python** | 3.11+ / 3.13 | AI Microservice & OCR pipeline |
| **Ollama** | Latest | Local LLM host (runs silently in the background) |

Pull the decomposition model if you haven't already:
```bash
ollama pull llama3.2:latest
# or llama3:latest
```

---

## Manual Step-by-Step Start

If you prefer to start services individually in separate terminals:

### 1. Configure the Environment
Ensure `.env` exists in the repository root:
```bash
cp .env.example .env
```

Key environment configuration:
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `DB_URL` | `jdbc:postgresql://localhost:55432/boostup` | PostgreSQL connection URL |
| `DB_USERNAME` | `boostup` | PostgreSQL username |
| `DB_PASSWORD` | `boostup` | PostgreSQL password |
| `RABBITMQ_HOST` | `localhost` | RabbitMQ broker host |
| `RABBITMQ_PORT` | `5672` | AMQP port |
| `RABBITMQ_USERNAME` | `boostup` | RabbitMQ user |
| `RABBITMQ_PASSWORD` | `boostup` | RabbitMQ password |
| `AI_SERVICE_OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API endpoint |
| `AI_SERVICE_OLLAMA_MODEL` | `llama3.2:latest` | Target LLM model |
| `VITE_API_BASE_URL` | `http://localhost:8082` | Backend gateway endpoint |

---

### 2. Start PostgreSQL & RabbitMQ
```bash
docker compose up -d
```
* **PostgreSQL** runs on `localhost:55432` with volume `boostup-postgres-data`.
* **RabbitMQ** runs on `localhost:5672` (AMQP) with volume `boostup-rabbitmq-data`.
* **RabbitMQ Management Dashboard** is available at `http://localhost:15672` (Login: `boostup` / `boostup`).

---

### 3. Verify Local Ollama (Runs in Background)
Ollama runs as a background service on Windows (`http://localhost:11434`). You do **not** need an open terminal window for it.

To test that Ollama is ready in the background:
```powershell
curl http://localhost:11434/api/tags
```
If Ollama was stopped, start it in the background:
```powershell
ollama serve
```

---

### 4. Start the AI Worker Microservice
In a new terminal:
```powershell
cd ai-service
# Activate virtual environment
.\.venv\Scripts\activate
# Start FastAPI and AMQP background worker
python -m uvicorn app.main:app --host 0.0.0.0 --port 8090 --reload
```
* **API & Swagger Docs**: `http://localhost:8090/docs`
* **Health Check**: `http://localhost:8090/api/v1/health`
* **Direct PDF Parse Endpoint**: `http://localhost:8090/api/v1/parse/pdf`

---

### 5. Start the Spring Boot Backend
In a new terminal:
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```
* **API Base URL**: `http://localhost:8082`
* **Job Status Endpoint**: `http://localhost:8082/api/v1/jobs/{jobId}`
* **Job Progress SSE**: `http://localhost:8082/api/v1/jobs/{jobId}/progress`

---

### 6. Start the React Frontend
In a new terminal:
```powershell
cd frontend
npm install
npm run dev
```
* Open **`http://localhost:5173`** in your browser.
* Log in, open a project, navigate to the **Backlog** tab, and click **"AI Decompose PRD"** to upload a document.

---

## Service Endpoints & Credentials Quick Reference

| Service | URL / Port | Credentials | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | `http://localhost:5173` | User registration / login | Agile dashboard & Kanban board |
| **Spring Boot Gateway** | `http://localhost:8082` | JWT Authentication | Core CRUD & Job Orchestration |
| **AI Worker API** | `http://localhost:8090` | Public / Internal | PyMuPDF, EasyOCR & Ollama Engine |
| **RabbitMQ Management** | `http://localhost:15672` | `boostup` / `boostup` | Queue monitoring & DLQ inspection |
| **PostgreSQL Database** | `localhost:55432` | `boostup` / `boostup` (DB: `boostup`) | Core data persistence |
| **Ollama Local Engine** | `http://localhost:11434` | None | Background LLM inference (`llama3.2:latest`) |

---

## Running Automated Tests & Verification

### Run Backend Unit & Integration Tests
```powershell
cd backend
.\mvnw.cmd test
```

### Run AI Microservice Tests (PyTest)
```powershell
cd ai-service
.\.venv\Scripts\python -m pytest tests
```

### Build Frontend for Production
```powershell
cd frontend
npm run build
```

---

## Troubleshooting

- **RabbitMQ connection refused:**
  Ensure Docker is running and execute `docker compose up -d rabbitmq`. Verify the container is healthy using `docker ps`.
- **Ollama inference timeout / model not found:**
  Run `ollama list` to verify `llama3.2:latest` (or `llama3:latest`) is installed. Update `AI_SERVICE_OLLAMA_MODEL` in `.env` if using a different model tag.
- **Scanned PDF slow on first run:**
  When a scanned or image-based PDF is processed, EasyOCR downloads language model weights on its first invocation. Subsequent runs use cached weights.
- **Port already in use:**
  Ensure no rogue processes are bound to ports `5173`, `8082`, `8090`, `5672`, `15672`, or `55432`.
- **Database volume migration:**
  The PostgreSQL volume is named `boostup-postgres-data`. To start with a clean database, run `docker compose down -v` followed by `docker compose up -d`.
