# =====================================================================
# NORTHSTAR PATTERN-MATCHING TRADING INTELLIGENCE - 1-CLICK RUNNER
# Khởi chạy đồng thời Backend API (FastAPI) và Frontend Dashboard (Vite)
# =====================================================================

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   🚀 NORTHSTAR TRADING INTELLIGENCE — 1-CLICK LAUNCHER              " -ForegroundColor Green
Write-Host "   Binance Futures XAUUSDT (Vàng) AI + Realtime TradingView Dashboard" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

$RootDir = $PSScriptRoot
$BackendDir = Join-Path $RootDir "Signal_Trade"
$FrontendDir = Join-Path $RootDir "ĐACN"

# 1. Xác định đường dẫn Python trong venv
$VenvPython = Join-Path $BackendDir "venv\Scripts\python.exe"
if (Test-Path $VenvPython) {
    $PythonExe = $VenvPython
    Write-Host "[INFO] Tìm thấy môi trường ảo Python tại: $VenvPython" -ForegroundColor DarkGray
} else {
    $PythonExe = "python"
    Write-Host "[WARN] Không tìm thấy venv cục bộ, sử dụng python hệ thống." -ForegroundColor Yellow
}

# 2. Khởi chạy Backend FastAPI Server
Write-Host ""
Write-Host "[1/3] 🔌 Đang khởi động Backend API (FastAPI) trên cổng 8000..." -ForegroundColor Cyan
$BackendProcess = Start-Process -FilePath $PythonExe `
    -ArgumentList "-m uvicorn src.api.server:app --host 0.0.0.0 --port 8000" `
    -WorkingDirectory $BackendDir `
    -PassThru

Write-Host "      Backend PID: $($BackendProcess.Id) -> http://localhost:8000" -ForegroundColor Green
Start-Sleep -Seconds 2

# 3. Khởi chạy Frontend Vite Dev Server
Write-Host ""
Write-Host "[2/3] 💻 Đang khởi động Frontend Dashboard (Vite) trên cổng 5173..." -ForegroundColor Cyan
$FrontendProcess = Start-Process -FilePath "npm.cmd" `
    -ArgumentList "run dev" `
    -WorkingDirectory $FrontendDir `
    -PassThru

Write-Host "      Frontend PID: $($FrontendProcess.Id) -> http://localhost:5173" -ForegroundColor Green
Start-Sleep -Seconds 3

# 4. Mở trình duyệt web
Write-Host ""
Write-Host "[3/3] 🌐 Đang mở trình duyệt tới Dashboard..." -ForegroundColor Green
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "   ✅ HỆ THỐNG ĐÃ HOẠT ĐỘNG HOÀN TOÀN TRÊN CỔNG 5173 VÀ 8000!         " -ForegroundColor Green
Write-Host "   • Web Dashboard:  http://localhost:5173                           " -ForegroundColor White
Write-Host "   • Swagger API:    http://localhost:8000/docs                      " -ForegroundColor White
Write-Host "   • WebSocket Live: ws://localhost:8000/ws/live                     " -ForegroundColor White
Write-Host "                                                                      " -ForegroundColor Gray
Write-Host "   [Nhấn Enter hoặc Ctrl+C bất cứ lúc nào để tắt toàn bộ hệ thống]    " -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Green
Write-Host ""

try {
    [void][System.Console]::ReadLine()
} finally {
    Write-Host "`nĐang dừng toàn bộ tiến trình hệ thống..." -ForegroundColor Yellow

    if ($BackendProcess -and -not $BackendProcess.HasExited) {
        Stop-Process -Id $BackendProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Host "✔ Đã tắt Backend API (PID $($BackendProcess.Id))." -ForegroundColor DarkGray
    }

    if ($FrontendProcess -and -not $FrontendProcess.HasExited) {
        Stop-Process -Id $FrontendProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Host "✔ Đã tắt Frontend Vite (PID $($FrontendProcess.Id))." -ForegroundColor DarkGray
    }

    Write-Host "Hệ thống đã dừng an toàn. Hẹn gặp lại!" -ForegroundColor Green
}
