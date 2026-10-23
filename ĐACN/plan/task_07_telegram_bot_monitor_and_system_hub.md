# TASK-07: TRUNG TÂM GIÁM SÁT VẬN HÀNH & TELEGRAM BOT HUB

## 1. TRẠNG THÁI (STATUS)
* **Trạng thái hiện tại:** 🔲 Chưa bắt đầu (Pending)
* **Người phụ trách:** Frontend Dev / System Admin
* **Độ ưu tiên:** Trung bình (P2)
* **Phụ thuộc:** [TASK-01](file:///d:/DACNTT-1/ĐACN/plan/task_01_backend_api_fastapi_and_data_bridge.md)

---

## 2. MỤC ĐÍCH (PURPOSE)
Biến trang **Telegram** và **Settings** cũ thành một Trung tâm giám sát và điều khiển vận hành thực tế (Operation & Control Hub): Cho phép người dùng theo dõi tình trạng kết nối mạng tới Binance, trạng thái cấu hình Telegram Bot, thử nghiệm bắn tín hiệu cảnh báo có ảnh chart snapshot trực tiếp từ giao diện web, và xem luồng log hệ thống thời gian thực.

---

## 3. MỤC TIÊU CHI TIẾT (OBJECTIVES)
* [ ] **Trạm giám sát kết nối (Connectivity Monitor):**
  * Hiển thị trạng thái kết nối Binance API (Độ trễ Ping ms, REST Endpoint OK).
  * Trạng thái luồng Binance WebSocket (`🟢 STREAMING btcusdt@kline_5m`).
  * Trạng thái cơ sở dữ liệu ký ức (`1,977 mẫu hình FAISS sẵn sàng`).
  * Thời gian hoạt động liên tục của bot (`Uptime`).
* [ ] **Bảng điều khiển Telegram Bot:**
  * Hiển thị Chat ID nhận tin (mã hóa an toàn `***`).
  * Nút bấm tiện ích: **"Gửi cảnh báo thử nghiệm (Send Test Alert)"** gọi tới API `/api/telegram/test-alert` để bắn ngay 1 bản tin HTML kèm biểu đồ snapshot về điện thoại để kiểm tra.
  * Hiển thị khung xem trước (Preview) giao diện bản tin cảnh báo trên Telegram.
* [ ] **Khung hiển thị Log hệ thống thời gian thực (Live Terminal Console):**
  * Một khung cửa sổ Terminal phong cách Dark Mode (`#090D16`) trên trang Settings/Telegram.
  * Tự động stream các dòng log mới nhất từ `Signal_Trade/logs/` (thông báo đóng nến, kết quả kiểm tra volume, tín hiệu sinh ra).

---

## 4. BẢN THIẾT KẾ GIAO DIỆN (UI WIREFRAME)

```
┌─────────────────────────────────────────────────────────────────┐
│ 📡 HỆ THỐNG GIÁM SÁT & CẢNH BÁO TELEGRAM (OPERATION HUB)        │
├─────────────────────────────────────────────────────────────────┤
│ [🟢 Binance API: 38ms]  [🟢 WebSocket: M5 Live]  [💓 Uptime: 4.2h]│
│ [🧠 FAISS Index: 1,977 mẫu] [⚙️ Ngưỡng tương đồng: 85%]        │
├─────────────────────────────────────────────────────────────────┤
│ 🤖 CẤU HÌNH BẮN TIN TELEGRAM BOT                                │
│ • Trạng thái: 🟢 ĐÃ KẾT NỐI (Telegram Bot API OK)               │
│ • Chat ID nhận tin: -100******4890                              │
│                                                                 │
│ [ 🚀 BẤM ĐỂ GỬI TÍN HIỆU THỬ NGHIỆM VỀ TELEGRAM (KÈM ẢNH) ]    │
├─────────────────────────────────────────────────────────────────┤
│ 💻 LIVE TERMINAL LOGS (DÒNG SỰ KIỆN HỆ THỐNG)                  │
│ [19:05:00] [INFO] --- BẮT ĐẦU CHU KỲ PHÂN TÍCH NẾN M5 ---       │
│ [19:05:01] [INFO] Volume Filter: PASS (Current=45.2, P20=18.2)  │
│ [19:05:02] [SUCCESS] FAISS so khớp: 14 mẫu tương đồng (87.5%)  │
│ [19:05:03] [SUCCESS] Đã gửi cảnh báo Telegram kèm ảnh snapshot! │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. CHECKLIST NGHIỆM THU (TICKBOX)
- [ ] Hiển thị chính xác trạng thái kết nối Binance và Telegram từ Backend.
- [ ] Nút "Gửi cảnh báo thử nghiệm" hoạt động thành công và nhận được tin nhắn trên Telegram thật.
- [ ] Khung Live Terminal hiển thị đúng các dòng log ghi nhận từ hệ thống.
