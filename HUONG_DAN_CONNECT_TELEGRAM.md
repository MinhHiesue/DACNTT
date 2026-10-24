# 📱 HƯỚNG DẪN KẾT NỐI VÀ NHẬN CẢNH BÁO TÍN HIỆU QUA TELEGRAM BOT

Hệ thống **Binance Pattern Signal Bot (Hybrid AI - FAISS + XGBoost)** hỗ trợ gửi cảnh báo tín hiệu giao dịch Vàng (XAUUSDT M5) trực tiếp và tức thì đến Telegram của từng người dùng thông qua cơ chế liên kết tài khoản tự động (Deep-linking) hoặc cấu hình Chat ID thủ công.

---

## 📑 MỤC LỤC
1. [Cách thức hoạt động của hệ thống](#1-cách-thức-hoạt-động-của-hệ-thống)
2. [Cách 1: Kết nối nhanh qua Web Dashboard (Khuyên dùng cho người dùng)](#2-cách-1-kết-nối-nhanh-qua-web-dashboard-khuyên-dùng)
3. [Cách 2: Tự tạo và cấu hình Telegram Bot riêng (Dành cho Quản trị viên / Dev)](#3-cách-2-tự-tạo-telegram-bot-riêng-admin--dev)
4. [Cách 3: Cấu hình Chat ID thủ công (Nhận tín hiệu trực tiếp không cần Web)](#4-cách-3-cấu-hình-chat-id-thủ-công)
5. [Hướng dẫn khởi chạy các tiến trình Bot](#5-hướng-dẫn-khởi-chạy-các-tiến-trình-bot)
6. [Mẫu thông báo tín hiệu nhận được trên Telegram](#6-mẫu-thông-báo-tín-hiệu-trên-telegram)
7. [Xử lý các sự cố thường gặp (Troubleshooting)](#7-xử-lý-các-sự-cố-thường-gặp)

---

## 1. CÁCH THỨC HOẠT ĐỘNG CỦA HỆ THỐNG

```
[ Người dùng trên Web ]
         │
         ▼ (Bấm "Kết nối ngay với Telegram")
[ Chuyển sang Telegram Bot: /start <UserId> ]
         │
         ▼
[ Telegram Listener (Python) ] ── (Gửi API link-telegram) ──► [ Backend Node.js ]
                                                                       │
                                                                       ▼
                                                             [ Lưu vào MongoDB ]
                                                               (telegramChatId)
                                                                       │
[ Signal Bot AI Engine ] ◄── (Đọc danh sách User nhận tin) ────────────┘
         │
         ▼ (Khi xuất hiện nến M5 thỏa mãn FAISS + XGBoost)
[ Broadcast Cảnh báo + Chart Snapshot tới Telegram từng User ] 🚀
```

---

## 2. CÁCH 1: KẾT NỐI NHANH QUA WEB DASHBOARD (KHUYÊN DÙNG)

Dành cho người dùng thông thường muốn nhận thông báo khi có tín hiệu:

### Bước 1: Khởi động hệ thống
- Chạy toàn bộ hệ thống bằng cách nhấp đúp vào file **`run_all.bat`** (hoặc chạy lệnh `.\run_all.ps1` trong PowerShell).

### Bước 2: Đăng nhập vào Dashboard
- Mở trình duyệt truy cập: **`http://localhost:5173`**
- Đăng ký tài khoản mới hoặc đăng nhập tài khoản hiện có.

### Bước 3: Bấm liên kết Telegram
- Tại thanh menu bên trái, chọn mục **"Telegram Bot"** (hoặc truy cập `http://localhost:5173/telegram`).
- Gạt nút trạng thái **BOT STATUS** sang **ON**.
- Bấm vào nút màu xanh **"Kết nối ngay với Telegram"** (hoặc quét mã / mở link bot `t.me/<Bot_Username>?start=<UserId>`).

### Bước 4: Xác nhận trên Telegram
- Ứng dụng Telegram sẽ tự động mở lên đoạn chat với Bot.
- Bấm nút **START** (hoặc gửi tin nhắn `/start <UserId>`).
- Bot sẽ lập tức phản hồi:
  > *✅ Kết nối tài khoản thành công! Từ bây giờ, bạn sẽ nhận được thông báo tín hiệu Vàng M5 tự động tại đây.*
- **Hoàn tất!** Mỗi khi AI quét thấy cơ hội Buy/Sell đạt chuẩn, bạn sẽ nhận được tin nhắn báo ngay tức khắc.

---

## 3. CÁCH 2: TỰ TẠO TELEGRAM BOT RIÊNG (ADMIN / DEV)

Nếu bạn muốn tạo một con Bot Telegram riêng thuộc quyền sở hữu của bạn:

### Bước 1: Đăng ký Bot với @BotFather
1. Mở ứng dụng Telegram, tìm kiếm **`@BotFather`** (có dấu tích xanh chính chủ).
2. Gửi lệnh: `/newbot`
3. Nhập **Tên hiển thị** cho Bot (ví dụ: `NorthStar Gold Signal`).
4. Nhập **Username** cho Bot (phải kết thúc bằng chữ `bot`, ví dụ: `NorthStarGold_Bot`).
5. `@BotFather` sẽ gửi cho bạn một chuỗi **HTTP API Access Token** (dạng: `8795438323:AAH7h5pK36mG3bdlKEIAGopq49i-4F7dC6I`). Hãy lưu lại chuỗi token này.

### Bước 2: Cập nhật cấu hình vào dự án
Mở 2 file sau và thay thế bằng `TELEGRAM_BOT_TOKEN` của bạn:

1. **`Signal_Trade/.env`**:
   ```env
   TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE
   MONGO_URI=mongodb://127.0.0.1:27017/
   DB_NAME=northstar_market
   BACKEND_API_URL=http://localhost:5000/api/link-telegram
   ```

2. **`Signal_Trade/config/.env`**:
   ```env
   TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE
   ```

3. **Cập nhật Username Bot trên giao diện Frontend**:
   - Mở file: `Frontend/src/components/telegram/TelegramConfigForm.jsx`
   - Tại dòng 13, đổi thành Username bot của bạn (không có ký tự `@`):
     ```javascript
     const botUsername = "NorthStarGold_Bot"; // Điền username bot thật của bạn
     ```

---

## 4. CÁCH 3: CẤU HÌNH CHAT ID THỦ CÔNG

Nếu bạn là nhà phát triển muốn thử nghiệm gửi tín hiệu trực tiếp đến một cá nhân hoặc một nhóm (Group/Channel) mà không cần chạy Website:

1. **Lấy Chat ID của bạn:**
   - Chat với bot **`@userinfobot`** hoặc **`@getmyid_bot`** trên Telegram.
   - Nhận về `Id` cá nhân của bạn (ví dụ: `1234567890`).
   - Nếu là Group/Channel: Thêm bot vào nhóm và cấp quyền admin, Chat ID nhóm thường có dấu trừ ở đầu (ví dụ: `-1001234567890`).

2. **Điền Chat ID vào cấu hình:**
   - Trong file `Signal_Trade/config/config.yaml`:
     ```yaml
     telegram:
       chat_id: "1234567890" # Thay bằng Chat ID của bạn
     ```
   - Hoặc thêm vào `Signal_Trade/.env`:
     ```env
     TELEGRAM_CHAT_ID=1234567890
     ```

---

## 5. HƯỚNG DẪN KHỞI CHẠY CÁC TIẾN TRÌNH BOT

### Cách A: Khởi chạy toàn diện 1-Click (Khuyên dùng)
Nhấp đúp chuột vào file:
```cmd
run_all.bat
```
*(File này sẽ mở đồng thời các cửa sổ: MongoDB, Node.js Backend, React Frontend, Telegram Listener và AI Signal Bot).*

---

### Cách B: Khởi chạy từng tiến trình độc lập bằng Terminal / CMD

1. **Khởi chạy Telegram Listener (để hứng sự kiện liên kết tài khoản từ web):**
   ```powershell
   cd Signal_Trade
   .\venv\Scripts\python.exe src/execution/telegram_listener.py
   ```

2. **Khởi chạy Bot phát tín hiệu (AI Engine quét thị trường M5 XAUUSDT):**
   - Chạy nhanh bằng file batch:
     ```cmd
     run_bot.bat
     ```
   - Hoặc chạy bằng lệnh Python:
     ```powershell
     cd Signal_Trade
     .\venv\Scripts\python.exe main.py --mode signal
     ```

---

## 6. MẪU THÔNG BÁO TÍN HIỆU TRÊN TELEGRAM

Khi thị trường thỏa mãn điều kiện đồng thuận kép giữa **FAISS Pattern Matching** và **XGBoost AI Classifier**, bot sẽ gửi thông báo có định dạng trực quan:

```text
🔔 [XAUUSDT M5 PATTERN SIGNAL — HYBRID AI] 🔔
━━━━━━━━━━━━━━━━━━━━━━
🎯 Khuyến nghị: 🟢 BUY / LONG
⏱ Thời gian đóng nến: 2026-10-24 12:05:00 UTC
🤖 Mô hình: Hybrid FAISS + XGBoost

📊 THÔNG SỐ KỸ THUẬT:
• Giá Entry: 2,745.50
• Stop Loss (SL): 2,739.00 (Δ 6.50 USD)
• Take Profit (TP): 2,758.50 (Δ 13.00 USD)
• Tỷ lệ R:R: 2.00 (Tối thiểu >= 1.5)
• Quản trị rủi ro: 1.0% Vốn / lệnh

🧠 DỮ LIỆU ĐỒNG THUẬN KÉP (DUAL CONFIRMATION):
• Độ đồng thuận FAISS: 86.4%
• XGBoost Xác nhận: 81.2%
• Số mẫu tương đồng: 12 mẫu lịch sử
• Trạng thái phê duyệt: ✅ APPROVED_HYBRID
━━━━━━━━━━━━━━━━━━━━━━
⚡ Hệ thống phát tín hiệu Hybrid Ensemble AI (FAISS + XGBoost)
```

---

## 7. XỬ LÝ CÁC SỰ CỐ THƯỜNG GẶP

| Vấn đề | Nguyên nhân | Cách khắc phục |
|---|---|---|
| **Bấm "Start" trên bot nhưng không thấy phản hồi** | Tiến trình `telegram_listener.py` chưa được bật. | Khởi chạy `python src/execution/telegram_listener.py` hoặc chạy `run_all.bat`. |
| **Báo lỗi "Không thể kết nối đến Backend API"** | Backend Node.js chưa chạy trên cổng 5000. | Chạy lại Backend bằng `npm start` trong thư mục `Backend`. |
| **Không nhận được tin nhắn khi thị trường biến động** | Chưa có nến M5 nào đóng cửa đạt đủ điều kiện đồng thuận kép (>= 80% FAISS và >= 45% XGBoost). | Chờ nến 5 phút kế tiếp đóng cửa để AI phân tích. |
| **Lỗi `401 Unauthorized` từ Telegram** | Bot Token bị sai hoặc đã bị thu hồi trên @BotFather. | Kiểm tra lại `TELEGRAM_BOT_TOKEN` trong file `Signal_Trade/.env`. |
