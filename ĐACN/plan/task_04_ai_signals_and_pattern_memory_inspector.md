# TASK-04: TRUNG TÂM TÍN HIỆU AI & BỘ SOI CHIẾU KÝ ỨC MẪU HÌNH (PATTERN INSPECTOR)

## 1. TRẠNG THÁI (STATUS)
* **Trạng thái hiện tại:** 🔲 Chưa bắt đầu (Pending)
* **Người phụ trách:** Frontend Dev / AI UX Designer
* **Độ ưu tiên:** Cao (P1 - Tính năng "đắt giá" nhất để thuyết phục người dùng/giám khảo)
* **Phụ thuộc:** [TASK-01](file:///d:/DACNTT-1/ĐACN/plan/task_01_backend_api_fastapi_and_data_bridge.md), [TASK-02](file:///d:/DACNTT-1/ĐACN/plan/task_02_clean_frontend_architecture_and_data_contracts.md)

---

## 2. MỤC ĐÍCH (PURPOSE)
Xây dựng màn hình **AI Signals Center** hoàn toàn mới, đồng thời bổ sung tính năng độc bản: **Pattern Memory Inspector (Soi chiếu ký ức mẫu hình)**. Tính năng này giải quyết triệt để tính chất "hộp đen" (black-box) của AI: Khi có tín hiệu BUY hoặc SELL, người dùng có thể nhấp vào để xem trực tiếp **các mẫu hình trong quá khứ đã được FAISS so khớp tương đồng** và diễn biến thắng lợi thực tế của chúng trong lịch sử.

---

## 3. MỤC TIÊU CHI TIẾT (OBJECTIVES)
* [ ] **Bảng tín hiệu AI thời gian thực (Live Signal Table):**
  * Các cột dữ liệu thực: Thời gian (UTC), Symbol (`BTC/USDT`), Hướng lệnh (`BUY / LONG` hoặc `SELL / SHORT`), Giá Entry, Stop Loss (kèm khoảng cách $Δ$), Take Profit (kèm khoảng cách $Δ$), Tỷ lệ R:R ($\ge 1.5$), Độ tự tin Cosine (%), Số mẫu ký ức khớp ($k \ge 10$), Trạng thái duyệt (`APPROVED` hoặc `REJECTED`).
  * Badge trạng thái rõ ràng: Nếu `REJECTED`, hiển thị tooltip lý do kỹ thuật (ví dụ: `SL_TOO_TIGHT`, `LOW_CONSENSUS`, `VOLUME_FILTER_FAIL`).
* [ ] **Thẻ tín hiệu nổi bật (Active Signal Hero Card):**
  * Hiển thị tín hiệu mới nhất ở vị trí trung tâm với visual trực quan: Thanh đo độ đồng thuận (Consensus Bar), thông số kỹ thuật chi tiết, mức đề xuất rủi ro 1% vốn.
* [ ] **Tính năng Pattern Memory Inspector (Modal / Drawer):**
  * Khi click vào một tín hiệu bất kỳ, mở giao diện soi chiếu ký ức:
    * Biểu đồ so sánh đường cong giá 15 nến hiện tại ($\Delta Close$) với đường cong của các mẫu hình lịch sử tương đồng nhất.
    * Bảng danh sách các mẫu hình tương đồng trong Memory Bank: Điểm tương đồng Cosine (ví dụ: `0.94`, `0.91`, `0.88`), thời điểm xảy ra trong quá khứ, mức tăng tối đa đạt được ($\text{Max Favorable Move}$).

---

## 4. BẢN THIẾT KẾ GIAO DIỆN (UI SPECIFICATION)

### 4.1. Cấu trúc Component:
* `src/components/signals/ActiveSignalHero.jsx`
* `src/components/signals/SignalHistoryTable.jsx`
* `src/components/signals/PatternInspectorModal.jsx` (Giao diện soi chiếu mẫu hình ký ức)
* `src/pages/AISignalsPage.jsx` (Tích hợp tổng thể)

### 4.2. Trực quan hóa độ tương đồng Cosine:
```
┌─────────────────────────────────────────────────────────────────┐
│ 🎯 BTC/USDT M5 - TÍN HIỆU ĐƯỢC DUYỆT: BUY / LONG                │
│ Entry: 65,100.00 | SL: 64,680.00 (-420.0) | TP: 65,730.00 (+630)│
│ Tỷ lệ R:R: 1.50  | Quản trị vốn: 1.0% Vốn ($100 / $10,000)      │
├─────────────────────────────────────────────────────────────────┤
│ 🧠 DỮ LIỆU KÝ ỨC (MEMORY BANK SO KHỚP QUA FAISS):              │
│ • Độ tự tin đồng thuận : [████████████████░░░░] 87.5%           │
│ • Số lượng mẫu tương đồng: 14 mẫu lịch sử (13 LONG, 1 SHORT)    │
│ • Tương đồng Cosine cao nhất: 93.4%                             │
│ [ 🔍 BẤM ĐỂ MỞ PATTERN INSPECTOR (XEM CÁC MẪU LỊCH SỬ) ]        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. CHECKLIST NGHIỆM THU (TICKBOX)
- [ ] Bảng tín hiệu hiển thị đúng 100% các trường kỹ thuật của `Signal_Trade`.
- [ ] Loại bỏ hoàn toàn các trường mock cũ (MACD, MA20, status tự chế).
- [ ] Xây dựng thành công `PatternInspectorModal` vẽ biểu đồ so khớp giữa nến hiện tại và nến ký ức trong quá khứ.
- [ ] Hỗ trợ bộ lọc nhanh theo hướng lệnh (Tất cả / LONG / SHORT) và trạng thái (Được duyệt / Bị từ chối).
