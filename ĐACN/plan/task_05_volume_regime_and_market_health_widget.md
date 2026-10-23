# TASK-05: WIDGET BỘ LỌC KHỐI LƯỢNG (VOLUME REGIME P20 - P85) & SỨC KHỎE THỊ TRƯỜNG

## 1. TRẠNG THÁI (STATUS)
* **Trạng thái hiện tại:** 🔲 Chưa bắt đầu (Pending)
* **Người phụ trách:** Frontend Dev / Data Visualization
* **Độ ưu tiên:** Trung bình (P2)
* **Phụ thuộc:** [TASK-01](file:///d:/DACNTT-1/ĐACN/plan/task_01_backend_api_fastapi_and_data_bridge.md), [TASK-02](file:///d:/DACNTT-1/ĐACN/plan/task_02_clean_frontend_architecture_and_data_contracts.md)

---

## 2. MỤC ĐÍCH (PURPOSE)
Trực quan hóa hoạt động của **Module 1 (Volume Regime Filter)** trong `Signal_Trade`. Giúp người dùng nhìn thấy ngay tức khắc trên giao diện: Nến hiện tại có đủ điều kiện thanh khoản để thuật toán quét mẫu hình hoạt động hay không, hay đang nằm trong vùng thanh khoản mỏng (đêm muộn) hoặc bão tin tức (FOMC, CPI).

---

## 3. MỤC TIÊU CHI TIẾT (OBJECTIVES)
* [ ] Thiết kế thanh đo trực quan (Linear Volume Regime Gauge) biểu thị 3 phân vùng rõ rệt:
  * **Vùng 1 (0 đến $P_{20}$ - Đỏ cam):** Thanh khoản mỏng (Thin Liquidity). Dễ bị giãn spread, trượt giá.
  * **Vùng 2 ($P_{20}$ đến $P_{85}$ - Xanh lá):** Vùng thanh khoản tối ưu (Optimal Regime). Mẫu hình kỹ thuật có độ tin cậy cao nhất.
  * **Vùng 3 (Trên $P_{85}$ - Đỏ đậm):** Bão biến động / Tin tức giật giá (News Spike). Rủi ro quét râu hai đầu.
* [ ] Con trỏ chỉ vị trí volume hiện tại (Current Volume Pointer) so với ngưỡng $P_{20}$ và $P_{85}$ của 100 nến gần nhất.
* [ ] Thẻ trạng thái bộ lọc:
  * `🟢 ĐẠT CHUẨN (PASS)`: Thị trường ở trạng thái ổn định, cho phép so khớp mẫu hình.
  * `🔴 BỎ QUA (FILTERED)`: Kèm lý do: `Volume < P20 (Thanh khoản mỏng)` hoặc `Volume > P85 (Bão biến động)`.
* [ ] Tích hợp widget này vào góc trên của trang **Market Analysis** và **Overview Dashboard**.

---

## 4. BẢN THIẾT KẾ KỸ THUẬT (VISUAL WIREFRAME)

```
┌─────────────────────────────────────────────────────────────────┐
│ 📊 VOLUME REGIME FILTER (100 NẾN M5 GẦN NHẤT)                   │
├─────────────────────────────────────────────────────────────────┤
│ Trạng thái: 🟢 ĐẠT CHUẨN (PASS) · Sẵn sàng quét mẫu hình       │
│                                                                 │
│ [Thanh khoản mỏng]        [VÙNG GIAO DỊCH LÝ TƯỞNG]    [Bão tin] │
│ 0 ────────────── P20 ═══════════════════════════════ P85 ────── │
│ [=== Đỏ cam ===] [========== XANH LÁ ==========] [== Đỏ đậm ==] │
│                        ▲ (Volume hiện tại: 42.5 BTC)            │
│                                                                 │
│ • Ngưỡng P20: 18.2 BTC  |  • Ngưỡng P85: 65.4 BTC               │
│ • Trung bình 100 nến: 34.1 BTC                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. CHECKLIST NGHIỆM THU (TICKBOX)
- [ ] Xây dựng component `VolumeRegimeGauge.jsx` hiển thị mượt mà trên giao diện Dark Mode.
- [ ] Nhận dữ liệu thực tế từ endpoint `/api/market/volume-regime`.
- [ ] Tự động chuyển đổi màu sắc và cảnh báo trạng thái tương ứng khi volume biến động.
- [ ] Tích hợp thành công vào thanh điều khiển của biểu đồ nến.
