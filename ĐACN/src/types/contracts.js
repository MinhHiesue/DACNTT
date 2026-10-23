/**
 * Định nghĩa chuẩn dữ liệu (Data Contracts / Interfaces) cho Frontend Dashboard.
 * Khớp 100% với Pydantic Schemas của Signal_Trade Backend.
 */

/**
 * @typedef {Object} KlineData
 * @property {number} time - Unix timestamp tính bằng giây (phù hợp TradingView)
 * @property {number} open - Giá mở cửa
 * @property {number} high - Giá cao nhất
 * @property {number} low - Giá thấp nhất
 * @property {number} close - Giá đóng cửa
 * @property {number} volume - Khối lượng giao dịch
 */

/**
 * @typedef {Object} SignalContract
 * @property {string} id - Mã định danh tín hiệu (ví dụ: sig-1700000000)
 * @property {string} timestamp - Chuỗi thời gian chuẩn ISO UTC
 * @property {number} timestamp_unix - Thời gian Unix timestamp (giây)
 * @property {string} symbol - Cặp giao dịch (BTCUSDT)
 * @property {('LONG'|'SHORT'|'NONE')} direction - Hướng lệnh đề xuất
 * @property {number} entry_price - Giá vào lệnh tại nến đóng
 * @property {number} stop_loss - Mức cắt lỗ theo Swing Low/High
 * @property {number} take_profit - Mức chốt lời mục tiêu
 * @property {number} delta_sl - Khoảng cách cắt lỗ ($)
 * @property {number} delta_tp - Khoảng cách chốt lời ($)
 * @property {number} rr_ratio - Tỷ lệ Risk : Reward
 * @property {number} suggested_lot - Kích thước vị thế đề xuất theo 1% rủi ro
 * @property {number} confidence - Tỷ lệ đồng thuận của mẫu hình ký ức (0.0 - 1.0)
 * @property {number} matched_count - Số lượng mẫu hình lịch sử tương đồng (k >= 10)
 * @property {('APPROVED'|'REJECTED')} status - Trạng thái thẩm định
 * @property {string|null} reject_reason - Lý do từ chối nếu không được duyệt
 */

/**
 * @typedef {Object} VolumeRegimeContract
 * @property {number} current_volume - Khối lượng nến M5 hiện tại
 * @property {number} p20 - Ngưỡng phân vị 20% của 100 nến
 * @property {number} p85 - Ngưỡng phân vị 85% của 100 nến
 * @property {boolean} pass_filter - Trạng thái đạt chuẩn volume?
 * @property {string} reason - Diễn giải trạng thái
 */

/**
 * @typedef {Object} PatternMatchContract
 * @property {number} id - Chỉ số mẫu hình trong Memory Bank
 * @property {('LONG'|'SHORT')} direction - Hướng đi trong lịch sử
 * @property {number} similarity - Điểm tương đồng Cosine Similarity (0.85 - 1.0)
 * @property {number} max_favorable_move - Mức giá thuận lợi tối đa đạt được
 * @property {number} entry_price - Giá vào lệnh của mẫu hình trong lịch sử
 * @property {string} timestamp - Thời điểm xảy ra mẫu hình trong quá khứ
 * @property {number[]} normalized_curve - Chuỗi biến động giá Delta Close 15 nến
 */

/**
 * @typedef {Object} PerformanceContract
 * @property {number} total_trades - Tổng số lệnh kiểm thử Out-of-sample
 * @property {number} win_trades - Số lệnh thắng
 * @property {number} loss_trades - Số lệnh thua
 * @property {number} winrate_pct - Tỷ lệ thắng (%)
 * @property {number} profit_factor - Hệ số lợi nhuận
 * @property {number} max_drawdown_pct - Mức sụt giảm tối đa (%)
 * @property {number} max_drawdown_usd - Mức sụt giảm tối đa ($)
 * @property {number} net_profit_usd - Lợi nhuận ròng ($)
 * @property {number} final_balance - Số dư cuối kỳ ($)
 * @property {number} sharpe_ratio - Chỉ số Sharpe Ratio
 * @property {number} sortino_ratio - Chỉ số Sortino Ratio
 * @property {number} win_loss_ratio - Tỷ lệ thắng/thua trung bình
 */

export const EMPTY_CONTRACT = {}
