# Running BoostUP

BoostUP is a Spring Boot API with a Vite + React frontend and a PostgreSQL database.

## Prerequisites
- Docker and Docker Compose
- Java 21
- Node.js 20+ and npm

## 1. Configure the environment
Create a local `.env` file from the example:

```bash
cp .env.example .env
```

The `.env` file is intentionally untracked. Never commit real credentials or signing secrets.

Default local values:

| Variable | Value |
| :--- | :--- |
| `DB_NAME` | `boostup` |
| `DB_URL` | `jdbc:postgresql://localhost:55432/boostup` |
| `DB_USERNAME` | `boostup` |
| `DB_PASSWORD` | `boostup` |
| `VITE_API_BASE_URL` | `http://localhost:8082/api` |

Change `JWT_SECRET` and the database password before using a shared or production environment.

## 2. Start PostgreSQL
From the repository root:

```bash
docker compose up -d
```

This starts PostgreSQL on host port `55432` with a persistent `boostup-postgres-data` volume.

## 3. Start the backend
```bash
cd backend
./mvnw spring-boot:run
```

On Windows Command Prompt or PowerShell:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

The API starts on `http://localhost:8082`.

## 4. Start the frontend
In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## 5. Run checks
Backend tests:

```powershell
cd backend
.\mvnw.cmd test
```

Frontend production build:

```powershell
cd frontend
npm run build
```

## Optional: AI service
The standalone FastAPI scaffold in `ai-service/` is not required for the core BoostUP application.

```powershell
cd ai-service
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8090
```

Health check: `http://localhost:8090/api/v1/health`
Swagger UI: `http://localhost:8090/docs`

## Troubleshooting
- **Database connection failed:** confirm Docker is running and `DB_URL` uses port `55432`.
- **Port already in use:** stop the process using `8082`, `5173`, or `55432`, or change `PORT` for the backend.
- **Frontend cannot reach the API:** verify `VITE_API_BASE_URL` and that the backend is running.
- **Old database volume after the rename:** the local Docker volume is now `boostup-postgres-data`. If you need the previous data, migrate it before removing the old volume.
