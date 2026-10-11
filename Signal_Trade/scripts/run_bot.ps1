# =====================================================================
# SCRIPT KHỞI CHẠY VÀ BẢO VỆ TIẾN TRÌNH XAU/USD PATTERN BOT (WINDOWS)
# Tự động khởi động lại nếu tiến trình bị crash hoặc mất kết nối
# =====================================================================

param (
    [string]$Mode = "dry-run"
)

$ErrorActionPreference = "Continue"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
Set-Location $RootDir

$PythonExe = Join-Path $RootDir "venv\Scripts\python.exe"

if (-not (Test-Path $PythonExe)) {
    Write-Host "[LỖI] Không tìm thấy môi trường ảo tại $PythonExe!" -ForegroundColor Red
    Write-Host "Vui lòng chạy 'python -m venv venv' và cài đặt dependencies trước." -ForegroundColor Yellow
    exit 1
}

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "KHỞI CHẠY XAU/USD PATTERN BOT Ở CHẾ ĐỘ: [$Mode]" -ForegroundColor Cyan
Write-Host "Thư mục làm việc: $RootDir" -ForegroundColor Gray
Write-Host "Nhấn Ctrl+C để thoát khỏi chế độ bảo vệ." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Green

while ($true) {
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Bắt đầu tiến trình Python..." -ForegroundColor Green
    & $PythonExe main.py --mode $Mode

    $ExitCode = $LASTEXITCODE
    if ($ExitCode -eq 0) {
        Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Tiến trình đã thoát bình thường (Code 0)." -ForegroundColor Cyan
        break
    } else {
        Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Cảnh báo: Tiến trình đã dừng đột ngột (Exit Code: $ExitCode)!" -ForegroundColor Red
        Write-Host "Đang chuẩn bị tự động khởi động lại sau 5 giây..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
}
