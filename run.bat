@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo               BoostUP Quick Launcher
echo   (PostgreSQL, RabbitMQ, Ollama, AI, Backend, Web)
echo ===================================================

:: Ensure .env exists
if not exist "%~dp0.env" (
    echo [.env] File not found. Creating .env from .env.example...
    copy "%~dp0.env.example" "%~dp0.env" >nul
    echo [.env] Default .env created.
)

:: Ensure Ollama is running in the background
curl -s http://localhost:11434/api/tags >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [*] Ollama daemon not detected. Starting Ollama in the background...
    start "" /b ollama serve >nul 2>&1
    timeout /t 3 /nobreak >nul
) else (
    echo [*] Ollama is already active in the background on http://localhost:11434
)

:: Check for Windows Terminal (wt.exe)
where wt.exe >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [*] Launching services inside Windows Terminal tabs...
    wt ^
    --title "Docker Infra" cmd /k "cd /d "%~dp0." && echo [1/4] Starting PostgreSQL (55432) and RabbitMQ (5672/15672)... && docker compose up" ^
    ; new-tab --title "AI Worker Service" cmd /k "cd /d "%~dp0ai-service" && echo [2/4] Starting BoostUP AI Service (FastAPI + RabbitMQ Worker) on port 8090... && if exist .venv\Scripts\activate.bat (call .venv\Scripts\activate.bat) && python -m uvicorn app.main:app --host 0.0.0.0 --port 8090 --reload" ^
    ; new-tab --title "Backend (Spring Boot)" cmd /k "cd /d "%~dp0backend" && echo [3/4] Starting Spring Boot API on port 8082... && call mvnw.cmd spring-boot:run" ^
    ; new-tab --title "Frontend (React)" cmd /k "cd /d "%~dp0frontend" && echo [4/4] Starting Vite Dev Server on port 5173... && npm run dev"
) else (
    echo [*] Windows Terminal not detected. Opening individual service windows...
    start "BoostUP [1/4] - Docker Infra" cmd /k "cd /d "%~dp0." && echo Starting PostgreSQL (55432) and RabbitMQ (5672/15672)... && docker compose up"
    start "BoostUP [2/4] - AI Service" cmd /k "cd /d "%~dp0ai-service" && echo Starting AI Service on port 8090... && if exist .venv\Scripts\activate.bat (call .venv\Scripts\activate.bat) && python -m uvicorn app.main:app --host 0.0.0.0 --port 8090 --reload"
    start "BoostUP [3/4] - Backend API" cmd /k "cd /d "%~dp0backend" && echo Starting Spring Boot API on port 8082... && call mvnw.cmd spring-boot:run"
    start "BoostUP [4/4] - Frontend Web" cmd /k "cd /d "%~dp0frontend" && echo Starting React Vite Dev Server on port 5173... && npm run dev"
)

echo.
echo [*] All launch commands dispatched!
echo.
echo Useful URLs once services finish booting:
echo   - BoostUP Web UI:           http://localhost:5173
echo   - Backend REST API:         http://localhost:8082
echo   - AI Worker API / Docs:     http://localhost:8090/docs
echo   - Ollama Local LLM:         http://localhost:11434 (runs in background)
echo   - RabbitMQ Management UI:   http://localhost:15672  (user: boostup / pass: boostup)
echo   - PostgreSQL Database:      localhost:55432        (db: boostup / user: boostup)
echo ===================================================
pause
