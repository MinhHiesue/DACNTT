# TASK-06: PHÂN TÍCH HIỆU SUẤT BACKTEST & BIỂU ĐỒ VỐN (INTERACTIVE EQUITY CURVE)

## 1. TRẠNG THÁI (STATUS)
* **Trạng thái hiện tại:** ✅ Hoàn thành (Completed)
* **Người phụ trách:** Frontend Dev / Data Engineer
* **Độ ưu tiên:** Cao (P1)
* **Phụ thuộc:** [TASK-01](file:///d:/DACNTT-1/ĐACN/plan/task_01_backend_api_fastapi_and_data_bridge.md), [TASK-02](file:///d:/DACNTT-1/ĐACN/plan/task_02_clean_frontend_architecture_and_data_contracts.md)

---

## 2. MỤC ĐÍCH (PURPOSE)
Thay thế toàn bộ trang **Performance** giả lập cũ bằng một trung tâm báo cáo kiểm thử lịch sử chuyên nghiệp (Backtest Analytics Hub). Đọc trực tiếp dữ liệu từ file nhật ký giao dịch thực tế [`reports/backtest_trades.csv`](file:///d:/DACNTT-1/Signal_Trade/reports/backtest_trades.csv) của `Signal_Trade` và vẽ **biểu đồ tăng trưởng tài sản (Interactive Equity Curve)** có thể rê chuột tương tác.

---

## 3. MỤC TIÊU CHI TIẾT (OBJECTIVES)
* [x] **Lưới chỉ số hiệu suất định lượng (Quantitative KPI Grid):**
  * Tổng số giao dịch (`Total Trades`: 123 lệnh).
  * Tỷ lệ thắng thực tế (`Winrate %`: 44.72%).
  * Hệ số lợi nhuận (`Profit Factor`: 1.03).
  * Mức sụt giảm tài sản tối đa (`Max Drawdown %`: 14.71% & `Max Drawdown USD`: -$1,681.83 USD).
  * Lợi nhuận ròng (`Net Profit USD`: +$245.16 USD) và Số dư cuối kỳ (`Final Balance USD`: $10,245.16 USD).
  * Tỷ lệ Sharpe & Sortino Ratio đo lường chất lượng rủi ro (`0.14 / 0.42`).
  * Tỷ lệ lãi/lỗ trung bình (`Win/Loss Ratio`: 1.27).
* [x] **Biểu đồ đường cong vốn tương tác (Interactive Equity Curve):**
  * Dựng bằng Area Series của Lightweight Charts trên nền Dark Mode Fintech.
  * Rê chuột qua từng điểm trên đồ thị hiển thị Tooltip: `Lệnh số #`, `Thời gian`, `Hướng đi`, `Lãi/Lỗ ($)`, `Số dư tài khoản`.
  * Có đường dóng mốc vốn ban đầu ($10,000 USD) làm đường tham chiếu (baseline).
* [x] **Bảng nhật ký kiểm thử chi tiết (Backtest Trade Ledger):**
  * Hiển thị từng lệnh quá khứ: Thời gian vào lệnh, Hướng (`LONG`/`SHORT`), Giá Entry, Giá Exit, Stop Loss, Take Profit, Lợi nhuận ròng ($), Lý do thoát lệnh (`TAKE_PROFIT`, `STOP_LOSS`, `TIMEOUT`), Số nến giữ lệnh (`Holding Bars`).
  * Hỗ trợ tìm kiếm, phân trang và bộ lọc: Chỉ xem lệnh thắng (`WIN`) hoặc chỉ xem lệnh thua (`LOSS`).

---

## 4. CÁC COMPONENT ĐÃ TRIỂN KHAI (IMPLEMENTATION)

1. [QuantitativeKPIGrid.jsx](file:///d:/DACNTT-1/ĐACN/src/components/performance/QuantitativeKPIGrid.jsx): Lưới 8 thẻ chỉ số định lượng thể hiện trung thực mọi góc độ rủi ro & lợi nhuận.
2. [InteractiveEquityCurve.jsx](file:///d:/DACNTT-1/ĐACN/src/components/performance/InteractiveEquityCurve.jsx): Biểu đồ đường cong tài sản thực tế từ $10,000 USD, tooltip rê chuột từng lệnh và đường tham chiếu vốn gốc.
3. [BacktestTradeLedger.jsx](file:///d:/DACNTT-1/ĐACN/src/components/performance/BacktestTradeLedger.jsx): Bảng sổ cái chi tiết toàn bộ các lệnh giao dịch kèm bộ lọc Thắng/Thua, tìm kiếm và phân trang.
4. [PerformancePage.jsx](file:///d:/DACNTT-1/ĐACN/src/pages/PerformancePage.jsx): Trang trung tâm kết nối với hook [usePerformance.js](file:///d:/DACNTT-1/ĐACN/src/hooks/usePerformance.js).
5. [HistoryPage.jsx](file:///d:/DACNTT-1/ĐACN/src/pages/HistoryPage.jsx): Nâng cấp trang lịch sử kết nối dữ liệu từ `useSignals` và bộ lọc chuẩn hóa.

---

## 5. CHECKLIST NGHIỆM THU (TICKBOX)
- [x] Gỡ bỏ các chỉ số tĩnh cũ trong `PerformancePage.jsx`.
- [x] Nhận dữ liệu thực tế từ endpoint `/api/performance/summary` và `/api/performance/trades`.
- [x] Vẽ thành công Equity Curve tương tác và hiển thị đúng mốc lãi ròng.
- [x] Bảng nhật ký có phân trang, lọc lệnh thắng/thua hoạt động trơn tru.
- [x] Lệnh `npm run build` vượt qua 100% trong `902ms`.
