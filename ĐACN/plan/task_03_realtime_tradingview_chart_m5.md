# TASK-03: TÁI CẤU TRÚC BIỂU ĐỒ TRADINGVIEW M5 (LIVE MARKERS & SL/TP LINES)

## 1. TRẠNG THÁI (STATUS)
* **Trạng thái hiện tại:** ✅ Hoàn thành (Completed)
* **Người phụ trách:** Frontend Dev / UI Engineer
* **Độ ưu tiên:** Khẩn cấp (P0 - Linh hồn trực quan của hệ thống)
* **Phụ thuộc:** [TASK-01](file:///d:/DACNTT-1/ĐACN/plan/task_01_backend_api_fastapi_and_data_bridge.md), [TASK-02](file:///d:/DACNTT-1/ĐACN/plan/task_02_clean_frontend_architecture_and_data_contracts.md)

---

## 2. MỤC ĐÍCH (PURPOSE)
Nâng cấp biểu đồ TradingView Lightweight Charts hiện tại thành một trạm quan sát phân tích kỹ thuật thời gian thực (Realtime Charting Station): Hiển thị nến BTC/USDT M5 từ Binance, đồng thời gắn trực tiếp các **mũi tên tín hiệu BUY/SELL** và các **đường dóng mức giá Entry, Stop Loss, Take Profit** ngay trên biểu đồ khi hệ thống AI phát hiện mẫu hình.

---

## 3. MỤC TIÊU CHI TIẾT (OBJECTIVES)
* [x] Tích hợp thư viện `lightweight-charts` v5 hiển thị Candlestick Series trên nền Dark Mode Fintech cao cấp (`#0D1117`).
* [x] Hiển thị Volume Series phụ trợ ở đáy biểu đồ, tự động đổi màu theo nến tăng (xanh lá `#08998144`) và nến giảm (đỏ `#F2364544`).
* [x] **Cơ chế gắn Markers tín hiệu (`createSeriesMarkers`):**
  * Tín hiệu LONG: Mũi tên xanh lá chỉ lên (`arrowUp`) đặt dưới đáy nến, chú thích `BUY @ [Giá]`.
  * Tín hiệu SHORT: Mũi tên đỏ chỉ xuống (`arrowDown`) đặt trên đỉnh nến, chú thích `SELL @ [Giá]`.
* [x] **Vẽ đường dóng giá động (`createPriceLine`):**
  * Đường Entry: Nét đứt màu xanh dương `#2962FF`, nhãn `ENTRY: $[Giá]`.
  * Đường Stop Loss: Nét liền màu đỏ `#F23645`, nhãn `SL: $[Giá] (-$Δ)`.
  * Đường Take Profit: Nét liền màu xanh lá `#089981`, nhãn `TP: $[Giá] (+$Δ | R:R)`.
* [x] **Khoanh vùng cửa sổ setup 15 nến:** Hiển thị mốc Swing Low và Swing High của 15 nến gần nhất để người dùng thấy rõ căn cứ đặt Stop Loss của Risk Manager.
* [x] Thanh công cụ trực quan: Hiển thị giá hiện tại, mức biến động 24h, badge trạng thái `● BINANCE M5 LIVE`, các nút Fit / Toggle Volume / Toggle SL-TP.
* [x] Tự động co giãn theo kích thước khung chứa với `ResizeObserver`.

---

## 4. CÁC COMPONENT ĐÃ TRIỂN KHAI (IMPLEMENTATION)

1. [TradingViewCandleChart.jsx](file:///d:/DACNTT-1/ĐACN/src/components/charts/TradingViewCandleChart.jsx): Component biểu đồ nến TradingView hoàn chỉnh với nến Binance M5, Volume phụ trợ, Marker tín hiệu AI và 3 đường dóng Entry / SL / TP cùng Swing High/Low.
2. [MarketAnalysisPage.jsx](file:///d:/DACNTT-1/ĐACN/src/pages/MarketAnalysisPage.jsx): Tích hợp `TradingViewCandleChart` làm biểu đồ trung tâm phân tích thị trường kết nối live với [useMarketData.js](file:///d:/DACNTT-1/ĐACN/src/hooks/useMarketData.js) và [useSignals.js](file:///d:/DACNTT-1/ĐACN/src/hooks/useSignals.js).
3. [MarketOverviewCard.jsx](file:///d:/DACNTT-1/ĐACN/src/components/dashboard/MarketOverviewCard.jsx): Nâng cấp thẻ phân tích giá trên Dashboard tổng quan để hiển thị trực tiếp biểu đồ nến thật kèm tín hiệu AI.

---

## 5. CHECKLIST NGHIỆM THU (TICKBOX)
- [x] Render thành công nến M5 thật từ Binance trên canvas TradingView.
- [x] Tự động cập nhật nến mới nhất khi có WebSocket/Polling.
- [x] Gắn marker mũi tên BUY/SELL chuẩn xác tại nến sinh tín hiệu.
- [x] Hiển thị 3 đường dóng ngang: Entry (Xanh dương), SL (Đỏ), TP (Xanh lá) với nhãn giá rõ ràng.
- [x] Thử nghiệm co giãn màn hình (Responsive) biểu đồ tự điều chỉnh kích thước (`ResizeObserver`).
- [x] Lệnh `npm run build` vượt qua 100% trong `722ms`.
