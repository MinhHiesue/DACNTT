# TASK-01: XÂY DỰNG BACKEND API (FASTAPI) & DATA BRIDGE CHO SIGNAL_TRADE

## 1. TRẠNG THÁI (STATUS)
* **Trạng thái hiện tại:** ✅ Hoàn thành (Completed)
* **Người phụ trách:** AI Agent / Dev
* **Độ ưu tiên:** Khẩn cấp (P0 - Nền tảng cho toàn bộ giao diện)
* **Phụ thuộc:** `Signal_Trade` (Toàn bộ các module đã hoàn thành)

---

## 2. MỤC ĐÍCH (PURPOSE)
Xây dựng một dịch vụ máy chủ API tốc độ cao, trọng lượng nhẹ bằng **FastAPI** và **Uvicorn** đặt trong thư mục `Signal_Trade`. Máy chủ này đóng vai trò là cây cầu dữ liệu (Data Bridge), trích xuất toàn bộ dữ liệu thật từ các module tính toán của `Signal_Trade` (Nến Binance, Bộ lọc Volume, So khớp FAISS, Quản trị rủi ro, Báo cáo Backtest) để cung cấp cho Dashboard React (`ĐACN`).

---

## 3. MỤC TIÊU CHI TIẾT (OBJECTIVES)
* [x] Cài đặt các thư viện cần thiết: `fastapi>=0.100.0`, `uvicorn>=0.23.0`.
* [x] Thiết lập cấu hình CORS (`CORSMiddleware`) cho phép frontend `http://localhost:5173` truy cập an toàn.
* [x] Xây dựng hệ thống Endpoints RESTful chuẩn hóa:
  1. `GET /api/health`: Kiểm tra trạng thái máy chủ, thời gian hoạt động (uptime), trạng thái kết nối Binance.
  2. `GET /api/market/klines`: Cung cấp 100-300 nến M5 gần nhất định dạng `{time, open, high, low, close, volume}` tương thích 100% với TradingView Lightweight Charts.
  3. `GET /api/market/volume-regime`: Trả về giá trị volume hiện tại, ngưỡng $P_{20}$, ngưỡng $P_{85}$, và trạng thái bộ lọc (PASS / REJECT).
  4. `GET /api/signals/latest`: Tín hiệu giao dịch mới nhất được sinh ra từ nến vừa đóng kèm chi tiết Entry, SL, TP, R:R, Confidence.
  5. `GET /api/signals/history`: Danh sách các tín hiệu đã phát ra gần đây.
  6. `GET /api/patterns/inspector`: Chi tiết các mẫu hình chiến thắng trong quá khứ được FAISS tìm thấy (để phục vụ tính năng soi chiếu ký ức).
  7. `GET /api/performance/summary`: Tổng hợp chỉ số Backtest (Winrate, Profit Factor, Max Drawdown, Sharpe, Sortino) từ file `reports/`.
  8. `GET /api/performance/trades`: Danh sách chi tiết các lệnh giao dịch kiểm thử lịch sử từ `reports/backtest_trades.csv`.
  9. `POST /api/telegram/test-alert`: Endpoint kích hoạt gửi tin nhắn thử nghiệm về Telegram.
* [x] Hỗ trợ WebSocket `/ws/live` để bắn cập nhật nến mới và tín hiệu trực tiếp xuống giao diện mà không cần reload trang.

---

## 4. BẢN THIẾT KẾ KỸ THUẬT (TECHNICAL DESIGN)

### 4.1. Vị trí tập tin:
* `Signal_Trade/src/api/server.py` (Khởi tạo FastAPI app và routes)
* `Signal_Trade/src/api/schemas.py` (Pydantic models chuẩn hóa Response)
* CLI chạy độc lập: `python -m src.api.server` hoặc `uvicorn src.api.server:app --port 8000 --reload`

### 4.2. Khung mã nguồn dự kiến:
```python
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from src.core.config_loader import load_config
from src.data.binance_loader import BinanceDataLoader
from src.engine.similarity_engine import SimilarityEngine
from src.features.volume_filter import VolumeRegimeFilter

app = FastAPI(title="Signal_Trade Pattern AI API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/market/klines")
def get_klines(symbol: str = "BTCUSDT", limit: int = 150):
    loader = BinanceDataLoader()
    df = loader.fetch_recent_bars(symbol=symbol, count=limit)
    # Chuyển đổi timestamp sang Unix timestamp (giây) cho Lightweight Charts
    records = []
    for _, row in df.iterrows():
        records.append({
            "time": int(row['timestamp'].timestamp()),
            "open": float(row['open']),
            "high": float(row['high']),
            "low": float(row['low']),
            "close": float(row['close']),
            "volume": float(row['volume']),
        })
    return {"symbol": symbol, "timeframe": "5m", "data": records}
```

---

## 5. NHỮNG LƯU Ý KỸ THUẬT QUAN TRỌNG
* **Định dạng thời gian cho Lightweight Charts:** TradingView Lightweight Charts yêu cầu trường `time` phải là số nguyên Unix timestamp tính bằng **giây** (hoặc chuỗi `YYYY-MM-DD`), KHÔNG ĐƯỢC dùng mili-giây. Cần chia 1000 nếu lấy timestamp từ Binance.
* **CORS Preflight:** Bắt buộc mở CORS cho cả `localhost` và `127.0.0.1` để tránh lỗi mạng khi trình duyệt gọi API.
* **Non-blocking Execution:** Các tác vụ nặng (như tải nến hoặc so khớp vector) cần được nạp sẵn vào bộ nhớ RAM của SimilarityEngine khi khởi động server, không tạo lại FAISS index trên mỗi request.

---

## 6. CHECKLIST NGHIỆM THU (TICKBOX)
- [x] Cài đặt thành công `fastapi` và `uvicorn` vào môi trường ảo `Signal_Trade/venv`.
- [x] Tạo file `src/api/server.py` với đầy đủ các REST endpoints yêu cầu.
- [x] Chạy thử nghiệm server trên cổng `8000` và mở Swagger UI thành công tại `http://localhost:8000/docs`.
- [x] Kiểm tra endpoint `/api/market/klines` trả về đúng định dạng mảng nến M5 của BTCUSDT từ Binance.
- [x] Kiểm tra endpoint `/api/performance/summary` đọc đúng file `backtest_trades.csv`.
- [x] Viết unit test cho FastAPI endpoints đảm bảo HTTP status 200.
