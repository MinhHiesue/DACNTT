# TASK-02: CHUẨN HÓA DATA CONTRACTS & DỌN DẸP FRONTEND CŨ

## 1. TRẠNG THÁI (STATUS)
* **Trạng thái hiện tại:** ✅ Hoàn thành (Completed)
* **Người phụ trách:** Frontend Dev / AI Agent
* **Độ ưu tiên:** Cao (P1)
* **Phụ thuộc:** [TASK-01](file:///d:/DACNTT-1/ĐACN/plan/task_01_backend_api_fastapi_and_data_bridge.md)

---

## 2. MỤC ĐÍCH (PURPOSE)
"Đập bỏ" toàn bộ các dữ liệu tĩnh giả lập trong thư mục `src/data/` (các trường MACD, MA20, danh sách coin không dùng ETH/BNB, trạng thái tự chế `EXPIRED`, `WATCH`, `HOLD`), đồng thời tái thiết kế lớp giao tiếp dữ liệu (Data Access Layer) của Frontend với các Data Contracts chuẩn xác, khớp 100% với dữ liệu sinh ra từ Backend `Signal_Trade`.

---

## 3. MỤC TIÊU CHI TIẾT (OBJECTIVES)
* [x] **Dọn dẹp mã nguồn cũ (Cleanup):**
  * Xóa bỏ hoặc chuẩn hóa lại `src/data/market.js`, `src/data/performance.js`, `src/data/signalUtils.js`.
  * Gỡ bỏ các logic lọc giả lập không cần thiết, tập trung chuyên sâu vào cặp giao dịch Binance M5.
* [x] **Xây dựng API Client trung tâm (`src/api/client.js`):**
  * Viết module đóng gói gọi API tới `http://localhost:8000` với cơ chế bắt lỗi (error handling) và tự động fallback về dữ liệu mẫu an toàn nếu Backend chưa bật.
* [x] **Định nghĩa các Data Contracts (`src/types/contracts.js`):**
  * `KlineData`: `{ time, open, high, low, close, volume }`
  * `SignalContract`: `{ id, timestamp, symbol, direction, entryPrice, stopLoss, takeProfit, deltaSl, deltaTp, rrRatio, confidence, matchedCount, status, rejectReason }`
  * `VolumeRegimeContract`: `{ currentVol, p20, p85, passFilter, reason }`
  * `PatternMatchContract`: `{ id, direction, similarity, maxFavorableMove, entryPrice, timestamp }`
  * `PerformanceContract`: `{ totalTrades, winTrades, lossTrades, winratePct, profitFactor, maxDrawdownPct, netProfitUsd, sharpeRatio, sortinoRatio }`
* [x] **Xây dựng Custom Hooks tiện ích cho React (`src/hooks/`):**
  * `useMarketData(symbol, limit)`: Tự động tải nến và cập nhật định kỳ.
  * `useSignals()`: Lắng nghe tín hiệu mới nhất và lịch sử.
  * `usePerformance()`: Nạp số liệu backtest từ server.
  * `useSystemHealth()`: Kiểm tra tình trạng kết nối backend và Binance API.

---

## 4. CHI TIẾT THỰC HIỆN (IMPLEMENTATION)

### 4.1. Cấu trúc thư mục mới của `src/`:
```
ĐACN/src/
├── api/
│   ├── client.js          # Fetch wrapper kết nối Backend
│   └── endpoints.js       # Danh sách URL endpoints
├── hooks/
│   ├── useMarketData.js   # Hook tải nến và volume regime
│   ├── useSignals.js      # Hook lấy tín hiệu realtime và lịch sử
│   └── usePerformance.js  # Hook lấy số liệu backtest
├── types/
│   └── contracts.js       # Định nghĩa Schema chuẩn
├── components/            # Các UI components tái cấu trúc
└── pages/                 # Các màn hình chính
```

### 4.2. Khung mã nguồn `src/api/client.js`:
```javascript
const API_BASE = 'http://localhost:8000/api'

export async function fetchKlines(symbol = 'BTCUSDT', limit = 150) {
  const res = await fetch(`${API_BASE}/market/klines?symbol=${symbol}&limit=${limit}`)
  if (!res.ok) throw new Error(`Lỗi tải nến: ${res.statusText}`)
  return await res.json()
}

export async function fetchVolumeRegime() {
  const res = await fetch(`${API_BASE}/market/volume-regime`)
  if (!res.ok) throw new Error(`Lỗi tải volume regime: ${res.statusText}`)
  return await res.json()
}

export async function fetchLatestSignal() {
  const res = await fetch(`${API_BASE}/signals/latest`)
  if (!res.ok) throw new Error(`Lỗi tải tín hiệu mới nhất: ${res.statusText}`)
  return await res.json()
}

export async function fetchPerformanceSummary() {
  const res = await fetch(`${API_BASE}/performance/summary`)
  if (!res.ok) throw new Error(`Lỗi tải báo cáo hiệu suất: ${res.statusText}`)
  return await res.json()
}
```

---

## 5. CHECKLIST NGHIỆM THU (TICKBOX)
- [x] Gỡ bỏ toàn bộ code mock rác không dùng đến trong `src/data/`.
- [x] Hoàn thành module `src/api/client.js` có xử lý timeout và error fallback.
- [x] Định nghĩa đầy đủ Data Contracts tại `src/types/contracts.js`.
- [x] Viết các React custom hooks (`useMarketData`, `useSignals`, `usePerformance`, `useSystemHealth`).
- [x] Kiểm tra `npm run build` xuất bản thành công không lỗi syntax hay missing import.
