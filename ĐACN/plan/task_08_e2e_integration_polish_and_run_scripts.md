# TASK-08: TÍCH HỢP TOÀN DIỆN (END-TO-END), TINH CHỈNH GIAO DIỆN & SCRIPT KHỞI CHẠY 1-CLICK

## 1. TRẠNG THÁI (STATUS)
* **Trạng thái hiện tại:** 🔲 Chưa bắt đầu (Pending)
* **Người phụ trách:** Lead Fullstack Dev / AI Agent
* **Độ ưu tiên:** Khẩn cấp (P0 - Nghiệm thu hoàn tất)
* **Phụ thuộc:** Tất cả các task từ [TASK-01](file:///d:/DACNTT-1/ĐACN/plan/task_01_backend_api_fastapi_and_data_bridge.md) đến [TASK-07](file:///d:/DACNTT-1/ĐACN/plan/task_07_telegram_bot_monitor_and_system_hub.md)

---

## 2. MỤC ĐÍCH (PURPOSE)
Hợp nhất toàn diện Frontend Dashboard (`ĐACN`) và Backend Engine (`Signal_Trade`) thành một giải pháp phần mềm hoàn chỉnh, thống nhất. Tinh chỉnh độ thẩm mỹ thị giác (Visual Polish) đạt chuẩn Fintech Dark Mode cao cấp và tạo **script khởi chạy 1-click duy nhất (`run_all.ps1`)** giúp người dùng hoặc ban giám khảo đồ án có thể bật toàn bộ hệ thống lên trải nghiệm ngay lập tức.

---

## 3. MỤC TIÊU CHI TIẾT (OBJECTIVES)
* [ ] **Kiểm tra luồng liên lạc khép kín (End-to-End Data Pipeline):**
  $$\text{Binance WebSocket / REST} \longrightarrow \text{FastAPI Server} \longrightarrow \text{React Hooks} \longrightarrow \text{TradingView Chart \& Signal Cards}$$
* [ ] **Xử lý sự cố mạng & Reconnect an toàn (Resilience):**
  * Khi Backend chưa bật hoặc đang khởi động lại: Giao diện hiển thị Banner thông báo màu vàng nhẹ nhàng (`Đang kết nối tới Backend AI Engine...`) thay vì bị crash màn hình trắng.
  * Tự động thử kết nối lại mỗi 3 giây.
* [ ] **Đóng gói Script khởi chạy 1-Click (`run_all.ps1` tại thư mục gốc):**
  * Tự động kích hoạt môi trường ảo Python và chạy FastAPI server trên cổng `8000`.
  * Tự động khởi chạy Vite dev server trên cổng `5173`.
  * Tự động mở trình duyệt web mặc định trỏ thẳng tới `http://localhost:5173`.
  * Đóng an toàn cả 2 tiến trình khi người dùng nhấn `Ctrl+C`.
* [ ] **Kiểm tra Build Production:**
  * Chạy `npm run build` trong `ĐACN` đảm bảo không có bất kỳ lỗi cú pháp, thiếu biến hoặc linting error nào.

---

## 4. CHI TIẾT SCRIPT KHỞI CHẠY DỰ KIẾN (`run_all.ps1`)

```powershell
# =====================================================================
# SCRIPT KHỞI CHẠY TOÀN BỘ HỆ THỐNG SIGNAL_TRADE & DASHBOARD (1-CLICK)
# =====================================================================

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "KHỞI CHẠY HỆ THỐNG PATTERN-MATCHING SIGNAL BOT & DASHBOARD" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green

$RootDir = $PSScriptRoot
$BackendDir = Join-Path $RootDir "Signal_Trade"
$FrontendDir = Join-Path $RootDir "ĐACN"
$PythonExe = Join-Path $BackendDir "venv\Scripts\python.exe"

# 1. Khởi chạy FastAPI Backend
Write-Host "[1/3] Đang khởi động Backend API (FastAPI) trên cổng 8000..." -ForegroundColor Yellow
$BackendJob = Start-Process -FilePath $PythonExe -ArgumentList "-m uvicorn src.api.server:app --port 8000" -WorkingDirectory $BackendDir -PassThru

Start-Sleep -Seconds 2

# 2. Khởi chạy Vite Frontend
Write-Host "[2/3] Đang khởi động Frontend Dashboard (Vite) trên cổng 5173..." -ForegroundColor Yellow
Set-Location $FrontendDir
$FrontendJob = Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -WorkingDirectory $FrontendDir -PassThru

Start-Sleep -Seconds 3

# 3. Mở trình duyệt web
Write-Host "[3/3] Đang mở trình duyệt Dashboard..." -ForegroundColor Green
Start-Process "http://localhost:5173"

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "HỆ THỐNG ĐÃ SẴN SÀNG! Nhấn phím bất kỳ để dừng toàn bộ tiến trình." -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green

$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Stop-Process -Id $BackendJob.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $FrontendJob.Id -Force -ErrorAction SilentlyContinue
Write-Host "Đã dừng toàn bộ hệ thống an toàn." -ForegroundColor Yellow
```

---

## 5. CHECKLIST NGHIỆM THU (TICKBOX)
- [ ] Script `run_all.ps1` khởi động mượt mà cả Backend lẫn Frontend chỉ bằng một lệnh duy nhất.
- [ ] Toàn bộ các trang (Overview, Market Analysis, AI Signals, Performance, Telegram, Settings) hoạt động đồng bộ với dữ liệu sống.
- [ ] Lệnh `npm run build` xuất bản thành công thư mục `dist/` sạch sẽ, không có cảnh báo nghiêm trọng.
- [ ] Nghiệm thu toàn diện hệ thống đạt chuẩn xuất sắc để báo cáo đồ án / thuyết trình thực chiến.
