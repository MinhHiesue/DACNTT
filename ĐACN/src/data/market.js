export const ASSETS = {
  gold: { label: 'Vàng giao ngay', symbol: 'XAU / USD', price: 2341.86, change: 0.82, color: '#ff705e' },
  btc: { label: 'Bitcoin', symbol: 'BTC / USDT', price: 67482.35, change: 1.34, color: '#66c6ff' },
}

export const signals = [
  { pair: 'XAU / USD', name: 'Vàng giao ngay', type: 'MUA', price: '2,341.86', target: '2,358.00', stop: '2,328.40', confidence: 87, time: '10:42:18', asset: 'gold' },
  { pair: 'BTC / USDT', name: 'Bitcoin', type: 'MUA', price: '67,482.35', target: '68,120.00', stop: '66,920.00', confidence: 82, time: '10:38:04', asset: 'btc' },
  { pair: 'XAU / USD', name: 'Vàng giao ngay', type: 'BÁN', price: '2,337.20', target: '2,319.00', stop: '2,349.80', confidence: 76, time: '10:21:51', asset: 'gold' },
  { pair: 'ETH / USDT', name: 'Ethereum', type: 'MUA', price: '3,521.80', target: '3,590.00', stop: '3,480.00', confidence: 71, time: '09:56:32', asset: 'crypto' },
]

export const signalNow = Date.now()
export const AI_SIGNAL_DATA = [
  { id: 'sig-01', pair: 'BTC/USDT', type: 'BUY', price: 67482.35, confidence: 87, minutesAgo: 2, status: 'ACTIVE', rsi: 62.7, macd: 50.16, trend: 'Tăng ngắn hạn', target: 68120, stop: 66920, analysis: 'Giá giữ trên MA 20, động lượng mua đang duy trì. RSI ở vùng trung tính tích cực, chưa có dấu hiệu quá mua.' },
  { id: 'sig-02', pair: 'ETH/USDT', type: 'SELL', price: 3521.8, confidence: 74, minutesAgo: 12, status: 'ACTIVE', rsi: 43.2, macd: -8.42, trend: 'Điều chỉnh', target: 3480, stop: 3575, analysis: 'MACD nằm dưới đường tín hiệu và RSI yếu hơn trung tuyến. Áp lực điều chỉnh vẫn hiện diện trong ngắn hạn.' },
  { id: 'sig-03', pair: 'BNB/USDT', type: 'HOLD', price: 608.42, confidence: 62, minutesAgo: 28, status: 'WATCH', rsi: 51.4, macd: 0.38, trend: 'Đi ngang', target: 0, stop: 0, analysis: 'Các chỉ báo đang thiếu đồng thuận. RSI quanh trung tuyến, MACD gần đường zero; ưu tiên quan sát chờ xác nhận.' },
  { id: 'sig-04', pair: 'BTC/USDT', type: 'SELL', price: 66890.1, confidence: 81, minutesAgo: 180, status: 'TARGET', rsi: 39.6, macd: -82.45, trend: 'Giảm ngắn hạn', target: 66100, stop: 67540, analysis: 'Động lượng giảm mở rộng cùng RSI dưới trung tuyến. Mục tiêu mô phỏng đã được chạm trong dữ liệu mẫu.' },
  { id: 'sig-05', pair: 'ETH/USDT', type: 'BUY', price: 3482.65, confidence: 79, minutesAgo: 300, status: 'TARGET', rsi: 58.1, macd: 12.76, trend: 'Phục hồi', target: 3550, stop: 3440, analysis: 'Giá hồi phục trên MA 20, MACD chuyển dương. Cấu trúc ngắn hạn cải thiện nhưng cần theo dõi vùng kháng cự.' },
  { id: 'sig-06', pair: 'BNB/USDT', type: 'SELL', price: 615.2, confidence: 71, minutesAgo: 1440, status: 'EXPIRED', rsi: 46.8, macd: -1.24, trend: 'Điều chỉnh nhẹ', target: 603, stop: 622, analysis: 'Tín hiệu giảm yếu dần khi RSI quay lại gần trung tính. Tín hiệu đã hết thời hạn theo dõi mô phỏng.' },
  { id: 'sig-07', pair: 'BTC/USDT', type: 'HOLD', price: 65924.7, confidence: 57, minutesAgo: 2880, status: 'WATCH', rsi: 49.7, macd: -4.15, trend: 'Tích lũy', target: 0, stop: 0, analysis: 'Biên độ thu hẹp và MACD gần zero cho thấy trạng thái tích lũy. Chưa có lợi thế rõ cho một hướng.' },
  { id: 'sig-08', pair: 'ETH/USDT', type: 'SELL', price: 3568.4, confidence: 83, minutesAgo: 5760, status: 'STOP', rsi: 37.4, macd: -16.9, trend: 'Giảm', target: 3495, stop: 3620, analysis: 'Đà giảm được xác nhận bởi MACD âm, tuy nhiên biến động ngược chiều đã chạm ngưỡng dừng mô phỏng.' },
  { id: 'sig-09', pair: 'BNB/USDT', type: 'BUY', price: 601.75, confidence: 76, minutesAgo: 8640, status: 'EXPIRED', rsi: 55.3, macd: 1.82, trend: 'Tăng nhẹ', target: 613, stop: 596, analysis: 'RSI và MACD cùng nghiêng nhẹ về phía tăng. Tín hiệu đã hết thời hạn, dữ liệu chỉ phục vụ xem giao diện.' },
  { id: 'sig-10', pair: 'BTC/USDT', type: 'BUY', price: 64208.5, confidence: 91, minutesAgo: 21600, status: 'TARGET', rsi: 66.2, macd: 125.7, trend: 'Tăng', target: 65800, stop: 63500, analysis: 'Động lượng tăng rõ rệt, giá duy trì trên MA 20. Mục tiêu mẫu đã đạt trước khi tín hiệu hết hiệu lực.' },
].map((signal) => ({ ...signal, createdAt: signalNow - signal.minutesAgo * 60_000 }))

export const MARKET_PAIRS = {
  'BTC/USDT': { name: 'Bitcoin', base: 67482.35, change: 2.84, high: 68391.2, low: 65420.1 },
  'ETH/USDT': { name: 'Ethereum', base: 3521.8, change: 1.67, high: 3598.4, low: 3430.65 },
  'BNB/USDT': { name: 'BNB', base: 608.42, change: -0.73, high: 619.85, low: 599.12 },
}

export const MARKET_TIMEFRAMES = {
  '1m': 60, '5m': 300, '15m': 900, '1h': 3600, '4h': 14400, '1d': 86400,
}
