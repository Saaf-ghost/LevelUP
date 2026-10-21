@REM @echo off
@REM setlocal enabledelayedexpansion
@REM new-tab --title "Test" cmd /k "cd "%~dp0." && echo hello"

wt ^
cmd /k "cd /d "%~dp0." && echo [Main Directory]" ^
; new-tab --title "Docker Database" cmd /k "cd /d "%~dp0." && echo Starting Docker Database && docker compose up" ^
; new-tab --title "Backend" cmd /k "cd /d "%~dp0backend" && echo Starting Backend Service && mvnw spring-boot:run" ^
; new-tab --title "Frontend" cmd /k "cd /d "%~dp0frontend" && echo Starting Frontend Service && npm run dev"