# TASK-06: PHÂN TÍCH HIỆU SUẤT BACKTEST & BIỂU ĐỒ VỐN (INTERACTIVE EQUITY CURVE)

## 1. TRẠNG THÁI (STATUS)
* **Trạng thái hiện tại:** 🔲 Chưa bắt đầu (Pending)
* **Người phụ trách:** Frontend Dev / Data Engineer
* **Độ ưu tiên:** Cao (P1)
* **Phụ thuộc:** [TASK-01](file:///d:/DACNTT-1/ĐACN/plan/task_01_backend_api_fastapi_and_data_bridge.md), [TASK-02](file:///d:/DACNTT-1/ĐACN/plan/task_02_clean_frontend_architecture_and_data_contracts.md)

---

## 2. MỤC ĐÍCH (PURPOSE)
Thay thế toàn bộ trang **Performance** giả lập cũ bằng một trung tâm báo cáo kiểm thử lịch sử chuyên nghiệp (Backtest Analytics Hub). Đọc trực tiếp dữ liệu từ file nhật ký giao dịch thực tế [`reports/backtest_trades.csv`](file:///d:/DACNTT-1/Signal_Trade/reports/backtest_trades.csv) của `Signal_Trade` và vẽ **biểu đồ tăng trưởng tài sản (Interactive Equity Curve)** có thể rê chuột tương tác.

---

## 3. MỤC TIÊU CHI TIẾT (OBJECTIVES)
* [ ] **Lưới chỉ số hiệu suất định lượng (Quantitative KPI Grid):**
  * Tổng số giao dịch (`Total Trades`).
  * Tỷ lệ thắng thực tế (`Winrate %`).
  * Hệ số lợi nhuận (`Profit Factor`).
  * Mức sụt giảm tài sản tối đa (`Max Drawdown %` & `Max Drawdown USD`).
  * Lợi nhuận ròng (`Net Profit USD`) và Số dư cuối kỳ (`Final Balance USD`).
  * Tỷ lệ Sharpe & Sortino Ratio đo lường chất lượng rủi ro.
  * Tỷ lệ lãi/lỗ trung bình (`Win/Loss Ratio`).
* [ ] **Biểu đồ đường cong vốn tương tác (Interactive Equity Curve):**
  * Dựng bằng thư viện biểu đồ nhẹ (Line Series của Lightweight Charts hoặc Canvas).
  * Rê chuột qua từng điểm trên đồ thị hiển thị Tooltip: `Lệnh số #`, `Thời gian`, `Hướng đi`, `Lãi/Lỗ ($)`, `Số dư tài khoản`.
  * Có đường dóng mốc vốn ban đầu ($10,000 USD) làm đường tham chiếu (baseline).
* [ ] **Bảng nhật ký kiểm thử chi tiết (Backtest Trade Ledger):**
  * Hiển thị từng lệnh quá khứ: Thời gian vào lệnh, Hướng (`LONG`/`SHORT`), Giá Entry, Giá Exit, Stop Loss, Take Profit, Lợi nhuận ròng ($), Lý do thoát lệnh (`TAKE_PROFIT`, `STOP_LOSS`, `TIMEOUT`), Số nến giữ lệnh (`Holding Bars`).
  * Hỗ trợ tìm kiếm, phân trang và bộ lọc: Chỉ xem lệnh thắng (`WIN`) hoặc chỉ xem lệnh thua (`LOSS`).

---

## 4. BẢN THIẾT KẾ GIAO DIỆN (UI WIREFRAME)

```
┌─────────────────────────────────────────────────────────────────┐
│ 📈 OUT-OF-SAMPLE BACKTEST PERFORMANCE (TẬP KIỂM THỬ ĐỘC LẬP)    │
├─────────────────────────────────────────────────────────────────┤
│ [ Tổng số lệnh: 123 ] [ Winrate: 44.7% ] [ Profit Factor: 1.03 ]│
│ [ Max Drawdown: 14.7% ] [ Net Profit: +$245.16 ] [ Vốn: $10,245] │
├─────────────────────────────────────────────────────────────────┤
│ BIỂU ĐỒ ĐƯỜNG CONG TÀI SẢN (EQUITY CURVE)                      │
│ $10,500 ───                              ╭────────╮             │
│ $10,000 ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈  │ (Vốn đầu $10k)
│  $9,500 ───                ╰───────╯                            │
│         0            30           60           90          120  │ (Số lệnh)
├─────────────────────────────────────────────────────────────────┤
│ 📋 NHẬT KÝ CHI TIẾT 123 LỆNH GIAO DỊCH KIỂM THỬ                │
│ [Bộ lọc: Tất cả | Chỉ lệnh Thắng | Chỉ lệnh Thua] [Tìm kiếm...] │
│ #   Thời gian   Hướng  Entry     Exit      Lãi/Lỗ    Lý do thoát│
│ 1   2024-08-25  LONG   64,800.0  65,430.0  +$159.84  TAKE_PROFIT│
│ 2   2024-08-25  SHORT  65,100.0  65,420.0  -$125.67  STOP_LOSS  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. CHECKLIST NGHIỆM THU (TICKBOX)
- [ ] Gỡ bỏ các chỉ số tĩnh cũ trong `PerformancePage.jsx`.
- [ ] Nhận dữ liệu thực tế từ endpoint `/api/performance/summary` và `/api/performance/trades`.
- [ ] Vẽ thành công Equity Curve tương tác và hiển thị đúng mốc lãi ròng.
- [ ] Bảng nhật ký có phân trang, lọc lệnh thắng/thua hoạt động trơn tru.
