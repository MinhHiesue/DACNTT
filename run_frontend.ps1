# Khởi chạy riêng Frontend Vite
$RootDir = $PSScriptRoot
$FrontendDir = Join-Path $RootDir "ĐACN"

Write-Host "Khởi chạy Frontend Dashboard tại http://localhost:5173..." -ForegroundColor Cyan
Set-Location $FrontendDir
npm run dev
