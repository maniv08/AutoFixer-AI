# AutoFixer AI PowerShell Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  AutoFixer AI - Starting Backend and Frontend Servers  " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$backendPath = Join-Path $PSScriptRoot "backend"
$frontendPath = Join-Path $PSScriptRoot "frontend"

Write-Host "`n[1/2] Starting FastAPI Backend on http://localhost:8000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendPath'; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

Write-Host "[2/2] Starting React Vite Frontend on http://localhost:5180 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendPath'; npm run dev"

Write-Host "`nAll services launched!" -ForegroundColor Green
Write-Host "- Frontend UI: http://localhost:5180" -ForegroundColor White
Write-Host "- Backend API Docs: http://localhost:8000/docs" -ForegroundColor White
