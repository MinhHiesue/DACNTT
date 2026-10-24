# TASK-09: NÂNG CẤP BIỂU ĐỒ CHUẨN PRO (DEEP HISTORY ZOOM, TRADINGVIEW UX & FULLSCREEN TERMINAL)

## 1. TRẠNG THÁI (STATUS)
* **Trạng thái hiện tại:** ✅ Hoàn thành (Completed)
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

| Vấn đề trước đây | Nguyên nhân kỹ thuật | Giải pháp chuẩn TradingView Pro đã thực hiện |
| :--- | :--- | :--- |
| **Không zoom out ra xa được** | Backend chỉ fetch 150 nến (`limit=150`); cấu hình `minBarSpacing` bị giới hạn mặc định (~6px). | 1. Mở rộng Backend endpoint `/api/market/klines` hỗ trợ tải 500, 1000, 1500 nến kết nối trực tiếp kho 17,280 nến Parquet.<br>2. Cấu hình `minBarSpacing: 0.5` cho phép zoom thu nhỏ cực đại như Binance thật. |
| **Không nén/giãn trục giá được** | Chưa bật tính năng `axisPressedMouseMove: { price: true, time: true }` trong `handleScale`. | Kích hoạt tương tác co giãn tự do trên cả trục tung (giá) và trục hoành (thời gian). Nhấp đúp chuột lên cột giá để auto-reset. |
| **Không cuộn sâu về quá khứ** | Số lượng nến cố định ít; thiếu thanh trượt chọn phạm vi lịch sử. | Thêm bộ nút chọn nhanh: `150B (Lướt sóng)` · `500B (Cấu trúc phiên)` · `1000B (Đa ngày)` · `1500B (Toàn cảnh)`. |
| **Không gian quan sát chật chội** | Chiều cao cố định ~520px trong khung panel. | Bổ sung nút **Fullscreen Terminal (Toàn màn hình)**: Phóng to 100% diện tích màn hình để phân tích nến và tín hiệu tập trung. |
| **Thanh thông tin OHLC sơ sài** | Header hiển thị tĩnh, màu sắc chưa nổi bật. | Thiết kế thanh Header Floating HUD chuẩn TradingView: Hiển thị giá O, H, L, C, Độ chênh lệch $\pm\Delta$, % Biến động nến, Khối lượng thực theo thời gian thực khi rê chuột. |

---

## 4. CÁC COMPONENT ĐÃ NÂNG CẤP (IMPLEMENTATION)

1. [server.py](file:///d:/DACNTT-1/Signal_Trade/src/api/server.py): Mở rộng endpoint `/api/market/klines` hỗ trợ `limit` lên tới 2,000 nến, cơ chế nạp thông minh từ Binance Live API và nạp sâu từ `data/raw/btcusdt_m5.parquet`.
2. [TradingViewCandleChart.jsx](file:///d:/DACNTT-1/ĐACN/src/components/charts/TradingViewCandleChart.jsx):
   - Cấu hình `minBarSpacing: 0.5`, `maxBarSpacing: 50`, `rightOffset: 12`.
   - Bật kéo co giãn trục giá dọc `axisPressedMouseMove: { price: true, time: true }` và nhấp đúp chuột `axisDoubleClickReset`.
   - Chế độ **Toàn Màn Hình (Fullscreen)** với nút bấm toggle `Maximize2` / `Minimize2`.
   - Nút phóng to (`+`), thu nhỏ (`-`), và nút `Fit` căn chỉnh tức thời.
   - Thanh HUD hiển thị O, H, L, C, $\Delta\$$ và $\Delta\%$ động.
3. [MarketAnalysisPage.jsx](file:///d:/DACNTT-1/ĐACN/src/pages/MarketAnalysisPage.jsx): Mặc định tải **1,000 nến M5** và cung cấp bộ chọn độ sâu nến `[150B]`, `[500B]`, `[1000B]`, `[1500B]`.
4. [MarketOverviewCard.jsx](file:///d:/DACNTT-1/ĐACN/src/components/dashboard/MarketOverviewCard.jsx): Tăng số lượng nến hiển thị từ 80 lên 300 nến.

---

## 5. CHECKLIST NGHIỆM THU (TICKBOX)
- [x] Backend API hỗ trợ lấy đến 1,500 - 2,000 nến mà không bị timeout.
- [x] Cho phép lăn chuột để zoom out siêu xa hiển thị hàng nghìn nến liên tục mà không bị khựng lại.
- [x] Kéo chuột trên thước đo giá bên phải để nén/giãn chiều cao nến hoạt động mượt mà.
- [x] Nhấp đúp chuột lên thước đo giá tự động reset tỷ lệ nến về vị trí cân đối.
- [x] Nút bấm `⛶ Toàn màn hình (Fullscreen)` hoạt động chuẩn xác trên trình duyệt.
- [x] Thanh HUD hiển thị thông số nến O, H, L, C, % thay đổi và Volume đổi màu sinh động theo con trỏ chuột.
- [x] Bộ nút chọn nhanh độ sâu nến: `[150B]`, `[500B]`, `[1000B]`, `[1500B]`.
- [x] Lệnh `npm run build` vượt qua 100% trong 1.19s không cảnh báo lỗi.
