# 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy Dự Án Toàn Tập

## 1. Các bước cài đặt mã nguồn dự án (Setup)

### Bước 1.1: Cài đặt Backend (Node.js API)

Mở Terminal 1 và chạy:

```bash
cd Backend
npm install
```

Tạo file `Backend/.env` với nội dung:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/northstar_market
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret_key_here
```

### Bước 1.2: Cài đặt Frontend (React)

Mở Terminal 2 và chạy:

```bash
cd Frontend
npm install
```

### Bước 1.3: Cài đặt Lõi AI Signal_Trade (Python)

Mở Terminal 3 và chạy:

```bash
cd Signal_Trade

# (Tùy chọn) Tạo môi trường ảo để các thư viện không xung đột với máy tính
python -m venv venv
# Kích hoạt môi trường ảo:
# Trên Windows: venv\Scripts\activate
# Trên Mac/Linux: source venv/bin/activate

# Cài đặt các thư viện lõi
pip install -r requirements.txt
```

Tạo file `Signal_Trade/config/.env` với nội dung:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
MONGO_URI=mongodb://127.0.0.1:27017/
DB_NAME=northstar_market
BACKEND_API_URL=http://localhost:5000/api/link-telegram
```

## 2. Khởi chạy hệ thống (Run)

Bạn cần mở **4 tab Terminal** riêng biệt và chạy đồng thời các lệnh sau:

* **Terminal 1 (Chạy Backend):**

  ```bash
  cd Backend
  npm run dev
  ```

* **Terminal 2 (Chạy Frontend):**

  ```bash
  cd Frontend
  npm run dev
  ```

* **Terminal 3 (Chạy Bot AI):**

  ```bash
  cd Signal_Trade
  # Nhớ activate venv nếu ở trên bạn có tạo môi trường ảo
  python main.py --mode signal
  ```

* **Terminal 4 (Chạy Telegram Listener):**

  ```bash
  cd Signal_Trade
  python src/execution/telegram_listener.py
  ```

## 3. Kiểm tra luồng (Testing)

1. Mở trình duyệt web: `http://localhost:5173`
2. Đăng nhập -> Vào trang **Telegram Bot Hub**.
3. Bấm **"Kết nối ngay với Telegram"** -> Trình duyệt sẽ yêu cầu mở ứng dụng Telegram.
4. Bấm **START** trên Telegram để hệ thống tự động lưu liên kết tài khoản vào Cơ sở dữ liệu.