# TASK-04: TRUNG TÂM TÍN HIỆU AI & BỘ SOI CHIẾU KÝ ỨC MẪU HÌNH (PATTERN INSPECTOR)

## 1. TRẠNG THÁI (STATUS)
* **Trạng thái hiện tại:** ✅ Hoàn thành (Completed)
* **Người phụ trách:** Frontend Dev / AI UX Designer
* **Độ ưu tiên:** Cao (P1 - Tính năng "đắt giá" nhất để thuyết phục người dùng/giám khảo)
* **Phụ thuộc:** [TASK-01](file:///d:/DACNTT-1/ĐACN/plan/task_01_backend_api_fastapi_and_data_bridge.md), [TASK-02](file:///d:/DACNTT-1/ĐACN/plan/task_02_clean_frontend_architecture_and_data_contracts.md)

---

## 2. MỤC ĐÍCH (PURPOSE)
Xây dựng màn hình **AI Signals Center** hoàn toàn mới, đồng thời bổ sung tính năng độc bản: **Pattern Memory Inspector (Soi chiếu ký ức mẫu hình)**. Tính năng này giải quyết triệt để tính chất "hộp đen" (black-box) của AI: Khi có tín hiệu BUY hoặc SELL, người dùng có thể nhấp vào để xem trực tiếp **các mẫu hình trong quá khứ đã được FAISS so khớp tương đồng** và diễn biến thắng lợi thực tế của chúng trong lịch sử.

---

## 3. MỤC TIÊU CHI TIẾT (OBJECTIVES)
* [x] **Bảng tín hiệu AI thời gian thực (Live Signal Table):**
  * Các cột dữ liệu thực: Thời gian (UTC), Symbol (`BTC/USDT`), Hướng lệnh (`BUY / LONG` hoặc `SELL / SHORT`), Giá Entry, Stop Loss (kèm khoảng cách $Δ$), Take Profit (kèm khoảng cách $Δ$), Tỷ lệ R:R ($\ge 1.5$), Độ tự tin Cosine (%), Số mẫu ký ức khớp ($k \ge 10$), Trạng thái duyệt (`APPROVED` hoặc `REJECTED`).
  * Badge trạng thái rõ ràng: Nếu `REJECTED`, hiển thị tooltip lý do kỹ thuật (ví dụ: `SL_TOO_TIGHT`, `LOW_CONSENSUS`, `VOLUME_FILTER_FAIL`).
* [x] **Thẻ tín hiệu nổi bật (Active Signal Hero Card):**
  * Hiển thị tín hiệu mới nhất ở vị trí trung tâm với visual trực quan: Thanh đo độ đồng thuận (Consensus Bar), thông số kỹ thuật chi tiết, mức đề xuất rủi ro 1% vốn, nút kích hoạt quét nến M5 (`triggerScan`).
* [x] **Tính năng Pattern Memory Inspector (Modal / Drawer):**
  * Khi click vào một tín hiệu bất kỳ hoặc bấm nút "Soi mẫu", mở giao diện soi chiếu ký ức:
    * Biểu đồ so sánh đường cong giá 15 nến hiện tại ($\Delta Close$) với đường cong của các mẫu hình lịch sử tương đồng nhất.
    * Bảng danh sách các mẫu hình tương đồng trong Memory Bank: Điểm tương đồng Cosine (ví dụ: `93.4%`, `91.2%`, `88.7%`), thời điểm xảy ra trong quá khứ, mức tăng tối đa đạt được ($\text{Max Favorable Move}$).

---

## 4. CÁC COMPONENT ĐÃ TRIỂN KHAI (IMPLEMENTATION)

1. [ActiveSignalHero.jsx](file:///d:/DACNTT-1/ĐACN/src/components/signals/ActiveSignalHero.jsx): Card nổi bật hiển thị tín hiệu AI mới nhất, thanh đo đồng thuận ký ức, mức quản trị rủi ro 1% vốn, nút kích hoạt quét nến M5 mới nhất.
2. [SignalTable.jsx](file:///d:/DACNTT-1/ĐACN/src/components/signals/SignalTable.jsx): Bảng tín hiệu chuẩn hóa các trường dữ liệu thực của `Signal_Trade`, hỗ trợ chọn dòng và nút mở nhanh Pattern Inspector.
3. [SignalDetailPanel.jsx](file:///d:/DACNTT-1/ĐACN/src/components/signals/SignalDetailPanel.jsx): Bảng chi tiết phân tích tín hiệu được chọn, hiển thị căn cứ Stop Loss Swing Low/High, tỷ lệ R:R, lý do từ chối (nếu có), và nút mở Modal soi chiếu.
4. [SignalStatsGrid.jsx](file:///d:/DACNTT-1/ĐACN/src/components/signals/SignalStatsGrid.jsx): Thống kê tổng quan số tín hiệu, số lệnh BUY/SELL, số tín hiệu ĐÃ DUYỆT và BỊ TỪ CHỐI.
5. [SignalFilters.jsx](file:///d:/DACNTT-1/ĐACN/src/components/signals/SignalFilters.jsx): Bộ lọc thực chiến theo Hướng lệnh (BUY/SELL), Trạng thái duyệt (APPROVED/REJECTED), và Khung thời gian.
6. [PatternInspectorModal.jsx](file:///d:/DACNTT-1/ĐACN/src/components/signals/PatternInspectorModal.jsx): Modal soi chiếu ký ức độc bản với biểu đồ SVG Curve so sánh trực quan giữa 15 nến hiện tại và các mẫu hình lịch sử trong FAISS Memory Bank.
7. [AISignalsPage.jsx](file:///d:/DACNTT-1/ĐACN/src/pages/AISignalsPage.jsx): Trang trung tâm kết nối toàn bộ các thành phần trên với hook [useSignals.js](file:///d:/DACNTT-1/ĐACN/src/hooks/useSignals.js).

---

## 5. CHECKLIST NGHIỆM THU (TICKBOX)
- [x] Bảng tín hiệu hiển thị đúng 100% các trường kỹ thuật của `Signal_Trade`.
- [x] Loại bỏ hoàn toàn các trường mock cũ (MACD, MA20, ETH/BNB, status tự chế).
- [x] Xây dựng thành công `PatternInspectorModal` vẽ biểu đồ so khớp giữa nến hiện tại và nến ký ức trong quá khứ.
- [x] Thẻ tín hiệu nổi bật `ActiveSignalHero` hiển thị trực quan thông tin nến và cơ chế đồng thuận.
- [x] Hỗ trợ bộ lọc nhanh theo hướng lệnh (Tất cả / LONG / SHORT) và trạng thái (Được duyệt / Bị từ chối).
- [x] Lệnh `npm run build` vượt qua 100% không cảnh báo lỗi cú pháp.
