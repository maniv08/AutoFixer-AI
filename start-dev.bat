@echo off
title AutoFixer AI - Launcher
echo ========================================================
echo   AutoFixer AI - Starting Backend and Frontend Servers
echo ========================================================
echo.

echo [1/2] Starting FastAPI Backend on http://localhost:8000 ...
start "AutoFixer AI - Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/2] Starting React Vite Frontend on http://localhost:5180 ...
start "AutoFixer AI - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo All services launched!
echo - Frontend UI: http://localhost:5180
echo - Backend API Docs: http://localhost:8000/docs
echo.
pause
