# TASK-05: WIDGET BỘ LỌC KHỐI LƯỢNG (VOLUME REGIME P20 - P85) & SỨC KHỎE THỊ TRƯỜNG

## 1. TRẠNG THÁI (STATUS)
* **Trạng thái hiện tại:** ✅ Hoàn thành (Completed)
* **Người phụ trách:** Frontend Dev / Data Visualization
* **Độ ưu tiên:** Trung bình (P2)
* **Phụ thuộc:** [TASK-01](file:///d:/DACNTT-1/ĐACN/plan/task_01_backend_api_fastapi_and_data_bridge.md), [TASK-02](file:///d:/DACNTT-1/ĐACN/plan/task_02_clean_frontend_architecture_and_data_contracts.md)

---

## 2. MỤC ĐÍCH (PURPOSE)
Trực quan hóa hoạt động của **Module 1 (Volume Regime Filter)** trong `Signal_Trade`. Giúp người dùng nhìn thấy ngay tức khắc trên giao diện: Nến hiện tại có đủ điều kiện thanh khoản để thuật toán quét mẫu hình hoạt động hay không, hay đang nằm trong vùng thanh khoản mỏng (đêm muộn) hoặc bão tin tức (FOMC, CPI).

---

## 3. MỤC TIÊU CHI TIẾT (OBJECTIVES)
* [x] Thiết kế thanh đo trực quan (Linear Volume Regime Gauge) biểu thị 3 phân vùng rõ rệt:
  * **Vùng 1 (0 đến $P_{20}$ - Đỏ cam / Amber):** Thanh khoản mỏng (Thin Liquidity). Dễ bị giãn spread, trượt giá.
  * **Vùng 2 ($P_{20}$ đến $P_{85}$ - Xanh lá / Emerald):** Vùng thanh khoản tối ưu (Optimal Regime). Mẫu hình kỹ thuật có độ tin cậy cao nhất.
  * **Vùng 3 (Trên $P_{85}$ - Đỏ đậm / Crimson):** Bão biến động / Tin tức giật giá (News Spike). Rủi ro quét râu hai đầu.
* [x] Con trỏ chỉ vị trí volume hiện tại (Current Volume Pointer) so với ngưỡng $P_{20}$ và $P_{85}$ của 100 nến gần nhất.
* [x] Thẻ trạng thái bộ lọc:
  * `🟢 ĐẠT CHUẨN (PASS)`: Thị trường ở trạng thái ổn định, cho phép so khớp mẫu hình.
  * `🔴 BỎ QUA (FILTERED)`: Kèm lý do: `Volume < P20 (Thanh khoản mỏng)` hoặc `Volume > P85 (Bão biến động)`.
* [x] Tích hợp widget này vào góc trên của trang **Market Analysis** và **Overview Dashboard**.

---

## 4. CÁC COMPONENT ĐÃ TRIỂN KHAI (IMPLEMENTATION)

1. [VolumeRegimeGauge.jsx](file:///d:/DACNTT-1/ĐACN/src/components/market/VolumeRegimeGauge.jsx): Component thanh đo trực quan 3 phân vùng, kim chỉ volume động theo thời gian thực, thẻ trạng thái PASS/FILTERED, và chỉ số chi tiết ($P_{20}, P_{85}$, Volume hiện tại).
2. [MarketAnalysisPage.jsx](file:///d:/DACNTT-1/ĐACN/src/pages/MarketAnalysisPage.jsx): Nhúng `VolumeRegimeGauge` ngay trên biểu đồ thị trường nến M5, lấy dữ liệu tự động từ hook [useMarketData.js](file:///d:/DACNTT-1/ĐACN/src/hooks/useMarketData.js).
3. [DashboardPage.jsx](file:///d:/DACNTT-1/ĐACN/src/pages/DashboardPage.jsx): Nhúng `VolumeRegimeGauge` trên trang tổng quan giúp giám sát nhanh tình trạng thị trường.

---

## 5. CHECKLIST NGHIỆM THU (TICKBOX)
- [x] Xây dựng component `VolumeRegimeGauge.jsx` hiển thị mượt mà trên giao diện Dark Mode.
- [x] Nhận dữ liệu thực tế từ endpoint `/api/market/volume-regime`.
- [x] Tự động chuyển đổi màu sắc và cảnh báo trạng thái tương ứng khi volume biến động.
- [x] Tích hợp thành công vào thanh điều khiển của biểu đồ nến và trang Market Analysis, Dashboard Overview.
- [x] Lệnh `npm run build` vượt qua 100% không cảnh báo lỗi cú pháp.
