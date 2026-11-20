# =====================================================================
# NORTHSTAR PATTERN-MATCHING TRADING INTELLIGENCE - 1-CLICK RUNNER
# Khởi chạy đồng thời Backend API (FastAPI) và Frontend Dashboard (Vite)
# =====================================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   🚀 NORTHSTAR TRADING INTELLIGENCE — 1-CLICK LAUNCHER              " -ForegroundColor Green
Write-Host "   Binance Futures XAUUSDT (Vàng) AI + Realtime TradingView Dashboard" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

$RootDir = $PSScriptRoot
$NodeBackendDir = Join-Path $RootDir "Backend"
$FastApiDir = Join-Path $RootDir "Signal_Trade"
$FrontendDir = Join-Path $RootDir "Frontend"
if (-not (Test-Path $FrontendDir)) { $FrontendDir = Join-Path $RootDir "ĐACN" }
$AuthBackendDir = Join-Path $RootDir "Backend"

$NodeBackendProcess = $null
$FastApiProcess = $null
$FrontendProcess = $null
$AuthBackendProcess = $null

try {
    # 0. Kiểm tra dịch vụ MongoDB
    $mongoService = Get-Service MongoDB -ErrorAction SilentlyContinue
    if ($mongoService) {
        if ($mongoService.Status -ne "Running") {
            Write-Host "[INFO] Đang khởi động dịch vụ MongoDB..." -ForegroundColor DarkGray
            Start-Service MongoDB -ErrorAction SilentlyContinue
        }
        Write-Host "✔ MongoDB Service: Đang hoạt động" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Không tìm thấy Windows Service 'MongoDB'. Hãy đảm bảo MongoDB đang chạy ở cổng 27017." -ForegroundColor Yellow
    }

    # 1. Khởi chạy Node.js Backend API (Port 5000)
    Write-Host ""
    Write-Host "[1/3] 🟢 Đang khởi động Node.js Auth & Telegram API trên cổng 5000..." -ForegroundColor Cyan
    $NodeBackendProcess = Start-Process -FilePath "node.exe" `
        -ArgumentList "src/server.js" `
        -WorkingDirectory $NodeBackendDir `
        -PassThru

    Write-Host "      Node Backend PID: $($NodeBackendProcess.Id) -> http://localhost:5000" -ForegroundColor Green
    Start-Sleep -Seconds 2

    # 2. Xác định Python venv và Khởi chạy FastAPI Server (Port 8000)
    $VenvPython = Join-Path $FastApiDir "venv\Scripts\python.exe"
    if (Test-Path $VenvPython) {
        $PythonExe = $VenvPython
        Write-Host "[INFO] Tìm thấy môi trường ảo Python tại: $VenvPython" -ForegroundColor DarkGray
    } else {
        $PythonExe = "python"
        Write-Host "[WARN] Không tìm thấy venv cục bộ, sử dụng python hệ thống." -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "[1/4] 🔌 Đang khởi động Backend API (FastAPI) trên cổng 8000..." -ForegroundColor Cyan
    $FastApiProcess = Start-Process -FilePath $PythonExe `
        -ArgumentList "-m uvicorn src.api.server:app --host 0.0.0.0 --port 8000" `
        -WorkingDirectory $FastApiDir `
        -PassThru

    Write-Host "      FastAPI PID: $($FastApiProcess.Id) -> http://localhost:8000" -ForegroundColor Green
    Start-Sleep -Seconds 2

    # Khởi chạy Express API phục vụ đăng ký và đăng nhập
    Write-Host ""
    Write-Host "[2/4] 🔐 Đang khởi động Auth API (Express) trên cổng 5000..." -ForegroundColor Cyan
    $AuthBackendProcess = Start-Process -FilePath "npm.cmd" `
        -ArgumentList "run dev" `
        -WorkingDirectory $AuthBackendDir `
        -PassThru

    Write-Host "      Auth Backend PID: $($AuthBackendProcess.Id) -> http://localhost:5000" -ForegroundColor Green
    Start-Sleep -Seconds 2

    # 3. Khởi chạy Frontend Vite Dev Server (Port 5173)
    Write-Host ""
    Write-Host "[3/4] 💻 Đang khởi động Frontend Dashboard (Vite) trên cổng 5173..." -ForegroundColor Cyan
    $FrontendProcess = Start-Process -FilePath "npm.cmd" `
        -ArgumentList "run dev" `
        -WorkingDirectory $FrontendDir `
        -PassThru

    Write-Host "      Frontend PID: $($FrontendProcess.Id) -> http://localhost:5173" -ForegroundColor Green
    Start-Sleep -Seconds 3

    # 4. Mở trình duyệt web
    Write-Host ""
    Write-Host "[4/4] 🌐 Đang mở trình duyệt tới Dashboard..." -ForegroundColor Green
    Start-Process "http://localhost:5173"

    Write-Host ""
    Write-Host "======================================================================" -ForegroundColor Green
    Write-Host "   ✅ HỆ THỐNG ĐÃ HOẠT ĐỘNG HOÀN TOÀN!                               " -ForegroundColor Green
    Write-Host "   • Web Dashboard:    http://localhost:5173                         " -ForegroundColor White
    Write-Host "   • FastAPI Docs:     http://localhost:8000/docs                    " -ForegroundColor White
    Write-Host "   • WebSocket Live:   ws://localhost:8000/ws/live                   " -ForegroundColor White
    Write-Host "   • Node Backend API: http://localhost:5000/api                     " -ForegroundColor White
    Write-Host "                                                                      " -ForegroundColor Gray
    Write-Host "   [Nhấn Enter hoặc Ctrl+C bất cứ lúc nào để tắt toàn bộ hệ thống]    " -ForegroundColor Yellow
    Write-Host "======================================================================" -ForegroundColor Green
    Write-Host ""

    # Chờ người dùng kết thúc
    if ([System.Console]::IsInputRedirected) {
        while ($true) { Start-Sleep -Seconds 1 }
    } else {
        [void][System.Console]::ReadLine()
    }

} catch {
    Write-Host ""
    Write-Host "[LỖI] Có lỗi xảy ra trong quá trình khởi chạy: $_" -ForegroundColor Red
    Write-Host "Nhấn phím Enter để đóng..." -ForegroundColor Yellow
    if (-not [System.Console]::IsInputRedirected) {
        [void][System.Console]::ReadLine()
    }
} finally {
    Write-Host "`nĐang dừng toàn bộ tiến trình hệ thống..." -ForegroundColor Yellow

    if ($NodeBackendProcess -and -not $NodeBackendProcess.HasExited) {
        Stop-Process -Id $NodeBackendProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Host "✔ Đã tắt Node Backend (PID $($NodeBackendProcess.Id))." -ForegroundColor DarkGray
    }

    if ($FastApiProcess -and -not $FastApiProcess.HasExited) {
        Stop-Process -Id $FastApiProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Host "✔ Đã tắt FastAPI Server (PID $($FastApiProcess.Id))." -ForegroundColor DarkGray
    }

    if ($FrontendProcess -and -not $FrontendProcess.HasExited) {
        Stop-Process -Id $FrontendProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Host "✔ Đã tắt Frontend Vite (PID $($FrontendProcess.Id))." -ForegroundColor DarkGray
    }

    if ($AuthBackendProcess -and -not $AuthBackendProcess.HasExited) {
        Stop-Process -Id $AuthBackendProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Host "✔ Đã tắt Auth API (PID $($AuthBackendProcess.Id))." -ForegroundColor DarkGray
    }

    Write-Host "Hệ thống đã dừng an toàn. Hẹn gặp lại!" -ForegroundColor Green
}
