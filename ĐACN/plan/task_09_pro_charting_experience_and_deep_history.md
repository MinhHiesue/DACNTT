# TASK-09: NÂNG CẤP BIỂU ĐỒ CHUẨN PRO (DEEP HISTORY ZOOM, TRADINGVIEW UX & FULLSCREEN TERMINAL)

## 1. TRẠNG THÁI (STATUS)
* **Trạng thái hiện tại:** 🔲 Chưa bắt đầu (Pending - Sẵn sàng thực hiện)
* **Người phụ trách:** Frontend Dev / Data Visualization Specialist
* **Độ ưu tiên:** Khẩn cấp (P0 - Trực tiếp giải quyết trải nghiệm người dùng theo phản hồi)
* **Phụ thuộc:** [TASK-01](file:///d:/DACNTT-1/ĐACN/plan/task_01_backend_api_fastapi_and_data_bridge.md), [TASK-03](file:///d:/DACNTT-1/ĐACN/plan/task_03_realtime_tradingview_chart_m5.md)

---

## 2. MỤC ĐÍCH (PURPOSE)
Khắc phục triệt để trải nghiệm biểu đồ hiện tại bị giới hạn (chỉ có 150 nến ngắn ngủi, không thể zoom out ra xa để xem toàn cảnh xu hướng lớn, thao tác chuột bị khựng cứng, thiếu tương tác co giãn trục giá).

Nâng cấp `TradingViewCandleChart.jsx` và Backend API lên chuẩn **TradingView Pro / Binance Trading Terminal**:
* Cung cấp độ sâu lịch sử lớn (hàng ngàn nến M5 từ kho 17,280 nến thực tế).
* Cho phép **zoom out cực xa** (thu nhỏ hàng nghìn nến để soi chu kỳ vĩ mô) và **zoom in cực gần** (nhìn chi tiết từng râu nến).
* Cho phép **kéo trục giá (Price Scale Drag)** để nén/giãn chiều cao nến theo ý muốn.
* Hỗ trợ **Chế độ toàn màn hình (Fullscreen Terminal Mode)** chuẩn sàn giao dịch quốc tế.

---

## 3. NGUYÊN NHÂN KỸ THUẬT VÀ PHƯƠNG ÁN GIẢI QUYẾT

| Vấn đề hiện tại | Nguyên nhân kỹ thuật | Giải pháp chuẩn TradingView Pro |
| :--- | :--- | :--- |
| **Không zoom out ra xa được** | Backend chỉ fetch 150 nến (`limit=150`); cấu hình `minBarSpacing` bị giới hạn mặc định (~6px). | 1. Mở rộng API endpoint `/api/market/klines` cho phép tải 500, 1000, 1500 nến từ Binance/Parquet.<br>2. Cấu hình `minBarSpacing: 0.5` cho phép zoom thu nhỏ cực đại như Binance thật. |
| **Không nén/giãn trục giá được** | Chưa bật tính năng `axisPressedMouseMove: { price: true, time: true }` trong `handleScale`. | Kích hoạt tương tác co giãn tự do trên cả trục tung (giá) và trục hoành (thời gian). |
| **Không cuộn sâu về quá khứ** | Số lượng nến cố định ít; thiếu thanh trượt chọn phạm vi lịch sử. | Thêm bộ nút chọn nhanh: `150 Nến (Lướt sóng)` / `500 Nến (Cấu trúc phiên)` / `1000 Nến (Toàn cảnh đa ngày)`. |
| **Không gian quan sát chật chội** | Chiều cao cố định ~520px trong khung panel. | Bổ sung nút **Fullscreen Terminal**: Kích hoạt API Fullscreen của trình duyệt để biến toàn bộ màn hình thành trạm phân tích chuyên sâu. |
| **Thanh thông tin OHLC sơ sài** | Header hiển thị tĩnh, màu sắc chưa nổi bật. | Thiết kế thanh Header Floating HUD chuẩn TradingView: Hiển thị giá O, H, L, C, Độ chênh lệch $\pm\Delta$, % Biến động nến, Khối lượng thực theo thời gian thực khi rê chuột. |

---

## 4. MỤC TIÊU CHI TIẾT (OBJECTIVES)

### 4.1. Nâng cấp Backend Data Pipeline (`Signal_Trade`):
* [ ] Cập nhật endpoint `/api/market/klines`:
  * Mở rộng tham số `limit` từ tối đa 500 lên tối đa **1,500 nến**.
  * Nếu nến Binance trả về chưa đủ độ sâu, tự động kết hợp với kho dữ liệu nến thực tế đã lưu tại `Signal_Trade/data/raw/btcusdt_m5.parquet` (17,280 nến) để người dùng có thể lùi về lịch sử nhiều tuần.

### 4.2. Tinh chỉnh cấu hình Lightweight Charts Engine (`TradingViewCandleChart.jsx`):
* [ ] **Cấu hình TimeScale chuyên sâu cho phép siêu Zoom:**
  ```javascript
  timeScale: {
    minBarSpacing: 0.5,      // Cho phép thu nhỏ nến siêu mỏng để zoom cực xa nhìn hàng nghìn nến
    maxBarSpacing: 50,       // Cho phép phóng to nến siêu đại để soi râu nến
    barSpacing: 9,           // Khoảng cách ban đầu tối ưu mắt nhìn
    rightOffset: 12,         // Khoảng trống bên phải nến hiện tại chuẩn TradingView
    fixLeftEdge: false,      // Không khóa mép trái, cho phép cuộn tự do
    fixRightEdge: false,
    lockVisibleTimeRangeOnResize: false,
  }
  ```
* [ ] **Cấu hình HandleScale & HandleScroll linh hoạt:**
  ```javascript
  handleScale: {
    mouseWheel: true,
    pinch: true,
    axisPressedMouseMove: { time: true, price: true }, // Kéo chuột trên thước giá để nén/giãn chiều cao nến
    axisDoubleClickReset: { time: true, price: true }, // Nhấp đúp chuột vào thước giá để reset tỷ lệ nến
  },
  handleScroll: {
    mouseWheel: false,       // Lăn chuột dùng để Zoom, không bị giật cuộn trang
    pressedMouseMove: true,  // Giữ chuột trái rê để kéo biểu đồ qua lại mượt mà
    horzTouchDrag: true,
    vertTouchDrag: true,
  }
  ```

### 4.3. Bổ sung các công cụ tiện ích trên thanh Toolbar:
* [ ] **Bộ chọn độ sâu nến (Depth Presets):**
  * `150 bars` (Quan sát vi mô 12 giờ)
  * `500 bars` (Quan sát phiên giao dịch 42 giờ)
  * `1000 bars` (Quan sát sóng trung hạn 3.5 ngày)
  * `1500 bars` (Toàn cảnh đa tuần)
* [ ] **Nút Fullscreen Terminal Mode:**
  * Phóng to biểu đồ tràn màn hình, che toàn bộ sidebar để tập trung 100% vào phân tích nến và tín hiệu.
* [ ] **Nút Reset View / Auto Scale:**
  * Căn chỉnh biểu đồ trở về tỷ lệ chuẩn chỉ với 1 click.

---

## 5. BẢN THIẾT KẾ GIAO DIỆN MỚI (VISUAL WIREFRAME)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ BTC/USDT M5 · Binance Feed   [150] [500] [1000] [1500 nến]    [⛶ Toàn màn hình]  │
│ O: 67,450.0  H: 67,520.0  L: 67,410.0  C: 67,482.3 (+0.48%)  Vol: 42.50 BTC    │
├─────────────────────────────────────────────────────────────────────────┬───────┤
│                                                        ▲ BUY @ 67,482   │ 68,000│
│                    ╭──╮                ╭───╮          TP ────────────── │ 67,800│
│      ╭╮           ╭╯  ╰╮              ╭╯   ╰╮                           │ 67,600│
│   ╭──╯╰─╮        ╭╯    ╰╮            ╭╯     ╰╮        ENTRY ─────────── │ 67,400│(Kéo lên/
│ ──╯     ╰────────╯      ╰────────────╯       ╰────    SL ────────────── │ 67,200│ xuống để
│                                                                         │ 67,000│ nén/giãn)
├─────────────────────────────────────────────────────────────────────────┴───────┤
│ ▄█▄█▄██▄█▄▄█▄██▄▄█▄█▄█▄▄█▄█▄██▄▄█▄█▄█▄▄█▄██▄█▄▄█▄██▄ (Volume Sub-series)        │
│ 10/18 12:00      10/20 00:00      10/21 12:00      10/23 00:00 (Zoom cực xa)   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. CHECKLIST NGHIỆM THU (TICKBOX)
- [ ] Backend API hỗ trợ lấy đến 1,500 nến mà không bị timeout.
- [ ] Cho phép lăn chuột để zoom out siêu xa hiển thị hàng nghìn nến liên tục mà không bị khựng lại.
- [ ] Kéo chuột trên thước đo giá bên phải để nén/giãn chiều cao nến hoạt động mượt mà.
- [ ] Nhấp đúp chuột lên thước đo giá tự động reset tỷ lệ nến về vị trí cân đối.
- [ ] Nút bấm `⛶ Toàn màn hình (Fullscreen)` hoạt động chuẩn xác trên trình duyệt.
- [ ] Thanh HUD hiển thị thông số nến O, H, L, C, % thay đổi và Volume đổi màu sinh động theo con trỏ chuột.
- [ ] Lệnh `npm run build` vượt qua 100% không cảnh báo lỗi.
