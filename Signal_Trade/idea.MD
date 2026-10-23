# SPECIFICATION DOCUMENT: BINANCE PATTERN-MATCHING SIGNAL BOT (M5)

## 1. TỔNG QUAN HỆ THỐNG (SYSTEM OVERVIEW)
* **Cặp giao dịch mục tiêu:** BTC/USDT (hoặc bất kỳ cặp nào trên Binance: ETHUSDT, PAXGUSDT, ...).
* **Khung thời gian chính (Primary Timeframe):** M5 (5 phút / nến).
* **Nguồn cấp dữ liệu:** Binance Public REST API (`/api/v3/klines`) & WebSocket (`<symbol>@kline_5m`). Hoàn toàn công khai, không cần API Key, không phụ thuộc vào MetaTrader 5 hay bất kỳ broker trung gian nào.
* **Định vị & Mục tiêu:** **Pure Signal Alerting System (Hệ thống bắn tín hiệu kỹ thuật)**. Không đặt lệnh thật (live trade), không đặt lệnh demo (paper trade broker), 100% chuyên tâm vào việc phân tích và gửi tín hiệu cảnh báo chất lượng cao (kèm ảnh biểu đồ Snapshot Dark Mode) về Telegram Bot.
* **Triết lý cốt lõi:** **Memory-Based Pattern Matching (So khớp mẫu hình dựa trên ký ức thị trường)**. Hệ thống không dự đoán ngẫu nhiên mà số hóa trạng thái 15 nến gần nhất thành Vector đặc trưng 49 chiều (Feature Vector), sau đó so khớp độ tương đồng Cosine Similarity với cơ sở dữ liệu các mẫu hình từng thắng lớn trong lịch sử.

---

## 2. KIẾN TRÚC KỸ THUẬT (SYSTEM ARCHITECTURE)

```
[Dữ liệu M5 Realtime từ Binance WebSocket / REST API]
│
▼
[Module 1: Volume Regime Filter] ──(Không đạt ngưỡng)──► [Bỏ qua nến]
│ (Đạt phân vị 20% - 85%)
▼
[Module 2: Feature Engineering & Normalization]
└── Trích xuất cửa sổ 15 nến setup thành Vector đặc trưng 49 chiều
│
▼
[Module 3: FAISS Vector Similarity Engine]
└── So khớp Cosine Similarity >= 0.85 với "Winning Pattern Database"
│
▼
[Module 4: Decision & Risk Management Engine]
├── Kiểm tra số lượng mẫu khớp (k >= 10, Độ đồng thuận hướng đi >= 80%)
├── Tính toán Entry (Close_t), SL (Swing Low/High + buffer $20), TP kỳ vọng
└── Kiểm duyệt điều kiện tỷ lệ R:R >= 1.5
│ (Thỏa mãn)
▼
[Module 5: Signal Alerting & Visual Delivery]
├── Sinh ảnh biểu đồ nến mini (Snapshot Dark Mode với đường dóng Entry/SL/TP)
└── Bắn thông báo định dạng HTML chi tiết qua Telegram Bot API
```

---

## 3. CÁC ĐIỂM CẢI TIẾN ĐẶC BIỆT KHI CHUYỂN SANG BINANCE

1. **Độc lập 100% với MetaTrader 5:**
   * Không cần cài đặt phần mềm MT5 terminal trên máy tính.
   * Không cần tài khoản MT5, login, password hay server broker.
   * Chạy cross-platform (Windows, Linux, macOS, Docker, VPS).
2. **Độ trễ thấp (Sub-second Latency):**
   * Sử dụng kết nối Binance WebSocket bắt sự kiện nến đóng ngay trong mili-giây.
   * Tự động dự phòng với cơ chế Polling REST API đảm bảo không bao giờ bỏ sót nến.
3. **Dữ liệu nến thật và đồng nhất:**
   * Tải trực tiếp hàng chục nghìn nến lịch sử từ Binance để khai thác mẫu hình (mining).
4. **An toàn tuyệt đối:**
   * Không can thiệp tài khoản giao dịch, loại bỏ hoàn toàn rủi ro trượt giá hoặc lỗi khớp lệnh sàn.