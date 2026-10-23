# Backend API quản lý tín hiệu

Backend Node.js, Express và MongoDB độc lập với thư mục frontend `ĐACN`. Backend cung cấp đăng ký/đăng nhập JWT và API quản lý tín hiệu; chưa tích hợp AI, Telegram hoặc sàn giao dịch.

## Yêu cầu

- Node.js 20 trở lên
- MongoDB đang chạy local hoặc một MongoDB URI có quyền đọc/ghi
- npm

## Cài đặt và cấu hình

Mở terminal trong thư mục `Backend`:

```bash
npm install
```

Tạo file `.env` trong `Backend` (có thể sao chép `.env.example`) và điền:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/northstar_market
FRONTEND_URL=http://localhost:5173
JWT_SECRET=replace-with-a-random-secret-at-least-32-characters-long
```

Thay `JWT_SECRET` bằng chuỗi ngẫu nhiên riêng dài ít nhất 32 ký tự. Có thể tạo bằng `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`. Nếu dùng MongoDB Atlas, thay `MONGODB_URI` bằng URI của cluster; không chia sẻ hay commit file `.env`.

## Khởi động

```bash
npm run dev
```

Server kết nối MongoDB trước khi lắng nghe tại `http://localhost:5000`. Kiểm tra kết nối:

```http
GET http://localhost:5000/api/health
```

Phản hồi thành công có `success: true` và `database: "connected"`.

## Đăng ký và đăng nhập

### Tạo tài khoản

```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json
```

```json
{
  "name": "Minh Le",
  "email": "minh@example.com",
  "password": "MatKhauDemo123"
}
```

Mật khẩu phải có ít nhất 8 ký tự và tối đa 72 byte UTF-8 (giới hạn của bcrypt). Server chỉ lưu mật khẩu đã băm; email đã đăng ký trả `409`.

### Đăng nhập

```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json
```

```json
{
  "email": "minh@example.com",
  "password": "MatKhauDemo123"
}
```

Đăng ký và đăng nhập trả token JWT có hạn một ngày cùng thông tin người dùng công khai, không trả mật khẩu.

### Lấy tài khoản hiện tại

```http
GET http://localhost:5000/api/auth/me
Authorization: Bearer <token>
```

Dashboard có giao diện `/login` và `/register`, xác minh phiên khi tải lại, hiển thị tên tài khoản và hỗ trợ đăng xuất. Toàn bộ API `/api/signals` yêu cầu header `Authorization: Bearer <token>`.

Để tạo ba tín hiệu mẫu (có thể chạy lại mà không tạo bản trùng):

```bash
npm run seed
```

## API

### Lấy danh sách tín hiệu

```http
GET http://localhost:5000/api/signals
Authorization: Bearer <token>
```

Trả về `count` và danh sách `data`, sắp xếp mới nhất trước.

### Lấy chi tiết tín hiệu

```http
GET http://localhost:5000/api/signals/<id>
Authorization: Bearer <token>
```

Thay `<id>` bằng giá trị `_id` nhận được từ API danh sách hoặc tạo mới. ID sai định dạng trả `400`; ID hợp lệ nhưng không tồn tại trả `404`.

### Tạo tín hiệu

```http
POST http://localhost:5000/api/signals
Content-Type: application/json
Authorization: Bearer <token>
```

Body mẫu (có thể gửi nhiều lần với giá trị khác):

```json
{
  "symbol": "BTC/USDT",
  "type": "BUY",
  "price": 67250.5,
  "confidence": 87,
  "status": "NEW",
  "analysis": "Giá giữ trên MA20, RSI tăng ổn định."
}
```

`symbol`, `type`, `price`, `confidence` và `analysis` là bắt buộc. `type` chỉ nhận `BUY`, `SELL` hoặc `HOLD`; `price` phải lớn hơn 0; `confidence` nằm trong khoảng 0–100. `status` mặc định là `NEW`; `createdAt` tự tạo nếu không gửi.

## Kiểm thử bằng Postman

1. Khởi động MongoDB và chạy `npm run dev`.
2. Gửi `GET http://localhost:5000/api/health` và xác nhận MongoDB có trạng thái `connected`.
3. Gửi `POST http://localhost:5000/api/auth/register` với JSON tài khoản mẫu ở trên, hoặc gọi `/api/auth/login` nếu đã đăng ký; sao chép `data.token`.
4. Với mỗi request tín hiệu, chọn **Authorization → Bearer Token** và dán token.
5. Chạy `npm run seed` trong terminal để thêm mẫu BTC/USDT, ETH/USDT và BNB/USDT.
6. Gửi `GET http://localhost:5000/api/signals`; sao chép `_id` của một tín hiệu.
7. Gửi `GET http://localhost:5000/api/signals/<id>` với ID vừa sao chép.
8. Gửi `POST http://localhost:5000/api/signals` với body JSON ở trên và xác nhận phản hồi `201`.
9. Thử gửi `"type": "WAIT"` hoặc `"confidence": 120` để kiểm tra lỗi `400`; thử gọi API tín hiệu không token để xác nhận lỗi `401`.

## Cấu trúc

- `src/config/database.js`: kết nối MongoDB từ biến môi trường.
- `src/models/User.js`: tài khoản và băm mật khẩu bằng bcrypt.
- `src/controllers/authController.js`, `src/routes/authRoutes.js`: đăng ký, đăng nhập và truy vấn tài khoản hiện tại.
- `src/middleware/requireAuth.js`: xác thực JWT cho API bảo vệ.
- `src/models/Signal.js`: schema và kiểm tra dữ liệu tín hiệu.
- `src/controllers/signalController.js`: xử lý danh sách, chi tiết và tạo tín hiệu.
- `src/routes/signalRoutes.js`: khai báo các route.
- `src/middleware/errorHandler.js`: định dạng phản hồi lỗi JSON.
- `scripts/seedSignals.js`: thêm dữ liệu mẫu có thể chạy lặp lại.
