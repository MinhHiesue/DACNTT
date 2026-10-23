# TASK-02: CHUẨN HÓA DATA CONTRACTS & DỌN DẸP FRONTEND CŨ

## 1. TRẠNG THÁI (STATUS)
* **Trạng thái hiện tại:** 🔲 Chưa bắt đầu (Pending)
* **Người phụ trách:** Frontend Dev / AI Agent
* **Độ ưu tiên:** Cao (P1)
* **Phụ thuộc:** [TASK-01](file:///d:/DACNTT-1/ĐACN/plan/task_01_backend_api_fastapi_and_data_bridge.md)

---

## 2. MỤC ĐÍCH (PURPOSE)
"Đập bỏ" toàn bộ các dữ liệu tĩnh giả lập trong thư mục `src/data/` (các trường MACD, MA20, danh sách coin không dùng ETH/BNB, trạng thái tự chế `EXPIRED`, `WATCH`, `HOLD`), đồng thời tái thiết kế lớp giao tiếp dữ liệu (Data Access Layer) của Frontend với các Data Contracts chuẩn xác, khớp 100% với dữ liệu sinh ra từ Backend `Signal_Trade`.

---

## 3. MỤC TIÊU CHI TIẾT (OBJECTIVES)
* [ ] **Dọn dẹp mã nguồn cũ (Cleanup):**
  * Xóa bỏ hoặc thay thế hoàn toàn `src/data/market.js`, `src/data/marketAnalysis.js`, `src/data/performance.js`.
  * Gỡ bỏ các logic lọc giả lập không cần thiết.
* [ ] **Xây dựng API Client trung tâm (`src/api/client.js`):**
  * Viết module đóng gói gọi API tới `http://localhost:8000` với cơ chế bắt lỗi (error handling) và tự động fallback về dữ liệu mẫu an toàn nếu Backend chưa bật.
* [ ] **Định nghĩa các Data Contracts (JSDoc / TypeScript interfaces):**
  * `KlineData`: `{ time, open, high, low, close, volume }`
  * `SignalContract`: `{ id, timestamp, symbol, direction, entryPrice, stopLoss, takeProfit, deltaSl, deltaTp, rrRatio, confidence, matchedCount, status, rejectReason }`
  * `VolumeRegimeContract`: `{ currentVol, p20, p85, passFilter, reason }`
  * `PatternMatchContract`: `{ id, direction, similarity, maxFavorableMove, entryPrice, timestamp }`
  * `PerformanceContract`: `{ totalTrades, winTrades, lossTrades, winratePct, profitFactor, maxDrawdownPct, netProfitUsd, sharpeRatio, sortinoRatio }`
* [ ] **Xây dựng Custom Hooks tiện ích cho React:**
  * `useMarketKlines(symbol, interval)`: Tự động tải nến và cập nhật định kỳ.
  * `useVolumeRegime()`: Lấy trạng thái phân vị volume nến hiện tại.
  * `useLatestSignal()`: Lắng nghe tín hiệu mới nhất.
  * `usePerformanceMetrics()`: Nạp số liệu backtest từ server.

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
- [ ] Gỡ bỏ toàn bộ code mock rác không dùng đến trong `src/data/`.
- [ ] Hoàn thành module `src/api/client.js` có xử lý timeout và error fallback.
- [ ] Viết các React custom hooks (`useMarketData`, `useSignals`, `usePerformance`).
- [ ] Kiểm tra frontend gọi thành công API tới Backend và log ra dữ liệu thực tế trên console trình duyệt.
