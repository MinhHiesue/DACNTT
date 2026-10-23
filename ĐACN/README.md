# Northstar Market Intelligence

Dashboard giao dịch frontend dựng bằng React, Vite, Tailwind CSS, Lucide React và Lightweight Charts. Giao diện có Overview, Phân tích thị trường, Tín hiệu AI, Lịch sử, Hiệu suất mô hình, Telegram Bot, Cài đặt và Trung tâm trợ giúp.

## Cấu trúc ứng dụng

- `src/components/layout/`: khung ứng dụng, sidebar và topbar dùng chung cho các route.
- `src/components/dashboard/`, `market/`, `signals/`, `history/`, `performance/`, `telegram/`, `settings/`, `help/`: component giao diện được chia theo tính năng và page.
- `src/components/charts/`: biểu đồ dùng trong dashboard và phân tích thị trường.
- `src/pages/`: mỗi file page kết hợp các component tương ứng thành một màn hình hoàn chỉnh.
- `src/data/`: dữ liệu mẫu, phép tính chỉ báo và tiện ích định dạng được dùng chung.
- `src/App.jsx`: định nghĩa SPA routes; `src/main.jsx`: khởi tạo React và `BrowserRouter`.

Các trang điều hướng bằng URL: `/overview`, `/market`, `/signals`, `/history`, `/performance`, `/telegram`, `/settings` và `/help`. Có thể tải trực tiếp hoặc làm mới trang tại các đường dẫn này.

## Chạy local

Yêu cầu Node.js 20.19+ hoặc 22.12+.

```bash
npm install
npm run dev
```

Mở URL Vite hiển thị trong terminal (thường là `http://localhost:5173/`). Tạo bản production bằng `npm run build` và xem thử bằng `npm run preview`.

Để dùng đăng nhập/đăng ký, cần khởi động MongoDB và backend trong terminal riêng: vào thư mục `../Backend`, cài dependencies bằng `npm install`, cấu hình `.env` theo [hướng dẫn backend](../Backend/README.md), rồi chạy `npm run dev`.

## Phạm vi hiện tại

- Phân tích thị trường hỗ trợ BTC/USDT, ETH/USDT, BNB/USDT với nến OHLC, MA(20), RSI(14), MACD(12, 26, 9) và sáu khung thời gian.
- AI Signals có thống kê BUY/SELL/HOLD, lọc cặp/loại/thời gian và chi tiết phân tích, RSI, MACD, xu hướng.
- Lịch sử, hiệu suất mô hình, cấu hình Telegram, tuỳ chọn giao diện và trợ giúp có tương tác mô phỏng tại chỗ.
- Tuỳ chọn “Bố cục gọn” trong Cài đặt giảm khoảng cách giao diện trên các trang và được lưu trên trình duyệt.
- Đăng nhập/đăng ký kết nối backend Node.js/Express/MongoDB; phiên đăng nhập dùng JWT. Backend nằm trong thư mục `../Backend`; xem hướng dẫn tại [Backend/README.md](../Backend/README.md).
- Giá, nến, chỉ báo, nhận định và dữ liệu tín hiệu hiển thị trong dashboard vẫn là dữ liệu mô phỏng; hiện chưa kết nối AI, Telegram hay API sàn giao dịch.
- Không có chức năng đặt lệnh mua bán.
- Không cần API key, dịch vụ bên thứ ba hoặc thư viện trả phí.
- Giao diện demo, không phải lời khuyên đầu tư.
