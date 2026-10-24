﻿# Khởi chạy riêng Backend API
$RootDir = $PSScriptRoot
$BackendDir = Join-Path $RootDir "Signal_Trade"
$PythonExe = Join-Path $BackendDir "venv\Scripts\python.exe"
if (-not (Test-Path $PythonExe)) { $PythonExe = "python" }

Write-Host "Khởi chạy Backend FastAPI tại http://localhost:8000 (Swagger: /docs)..." -ForegroundColor Cyan
Set-Location $BackendDir
& $PythonExe -m uvicorn src.api.server:app --reload --host 0.0.0.0 --port 8000
