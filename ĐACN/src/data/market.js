/**
 * Dữ liệu chuẩn hóa thị trường & Tín hiệu Pattern-Matching AI cho XAU/USDT (Vàng).
 * Đồng bộ với Signal_Trade Backend (Binance Futures M5).
 */

export const ASSETS = {
  gold: { label: 'Vàng vĩnh cửu (Binance Futures)', symbol: 'XAU / USDT', price: 4005.50, change: 0.85, color: '#f59e0b' },
  xau: { label: 'Vàng vĩnh cửu (Binance Futures)', symbol: 'XAU / USDT', price: 4005.50, change: 0.85, color: '#f59e0b' },
  btc: { label: 'Bitcoin (Binance)', symbol: 'BTC / USDT', price: 67482.35, change: 1.85, color: '#f7931a' },
}

export const signalNow = Date.now()

export const AI_SIGNAL_DATA = [
  {
    id: 'sig-01',
    pair: 'XAU/USDT',
    symbol: 'XAUUSDT',
    type: 'BUY',
    direction: 'LONG',
    price: 4005.50,
    entry_price: 4005.50,
    stop: 3996.50,
    stop_loss: 3996.50,
    target: 4019.00,
    take_profit: 4019.00,
    delta_sl: 9.0,
    delta_tp: 13.5,
    rr_ratio: 1.50,
    suggested_lot: 0.15,
    confidence: 88.5,
    matched_count: 16,
    minutesAgo: 4,
    status: 'APPROVED',
    analysis: 'FAISS so khớp 16 mẫu hình thắng trong Memory Bank với độ đồng thuận 88.5%. Cấu trúc 15 nến setup hình thành Swing Low vững chắc tại 3,996.50.'
  },
  {
    id: 'sig-02',
    pair: 'XAU/USDT',
    symbol: 'XAUUSDT',
    type: 'SELL',
    direction: 'SHORT',
    price: 4018.20,
    entry_price: 4018.20,
    stop: 4026.20,
    stop_loss: 4026.20,
    target: 4006.20,
    take_profit: 4006.20,
    delta_sl: 8.0,
    delta_tp: 12.0,
    rr_ratio: 1.50,
    suggested_lot: 0.20,
    confidence: 84.0,
    matched_count: 13,
    minutesAgo: 38,
    status: 'APPROVED',
    analysis: 'So khớp 13 mẫu hình lịch sử tương đồng 84%. Nến M5 đóng cửa dưới ngưỡng kháng cự Swing High vùng 4,026.'
  },
  {
    id: 'sig-03',
    pair: 'XAU/USDT',
    symbol: 'XAUUSDT',
    type: 'BUY',
    direction: 'LONG',
    price: 3995.00,
    entry_price: 3995.00,
    stop: 3993.50,
    stop_loss: 3993.50,
    target: 3997.25,
    take_profit: 3997.25,
    delta_sl: 1.5,
    delta_tp: 2.25,
    rr_ratio: 1.50,
    suggested_lot: 0.0,
    confidence: 86.0,
    matched_count: 11,
    minutesAgo: 85,
    status: 'REJECTED',
    reject_reason: 'SL_TOO_TIGHT (Δ 1.5 USD < 3.0 USD)',
    analysis: 'Tín hiệu bị từ chối bởi Risk Manager do khoảng cách Stop Loss quá hẹp ($1.5 < $3.0), tránh nguy cơ dính spread.'
  },
  {
    id: 'sig-04',
    pair: 'XAU/USDT',
    symbol: 'XAUUSDT',
    type: 'BUY',
    direction: 'LONG',
    price: 3988.00,
    entry_price: 3988.00,
    stop: 3978.00,
    stop_loss: 3978.00,
    target: 4003.00,
    take_profit: 4003.00,
    delta_sl: 10.0,
    delta_tp: 15.0,
    rr_ratio: 1.50,
    suggested_lot: 0.18,
    confidence: 92.4,
    matched_count: 19,
    minutesAgo: 190,
    status: 'APPROVED',
    analysis: 'Độ tự tin rất cao (92.4%), 19 mẫu hình lịch sử đồng thuận kịch bản tăng trưởng mạnh của Vàng.'
  }
].map((signal) => ({ ...signal, createdAt: signalNow - signal.minutesAgo * 60_000 }))

export const signals = AI_SIGNAL_DATA.map((s) => ({
  pair: s.pair,
  name: 'Vàng vĩnh cửu (Binance Futures)',
  type: s.type === 'BUY' ? 'MUA' : 'BÁN',
  price: s.price.toLocaleString('en-US', { minimumFractionDigits: 2 }),
  target: s.target.toLocaleString('en-US', { minimumFractionDigits: 2 }),
  stop: s.stop.toLocaleString('en-US', { minimumFractionDigits: 2 }),
  confidence: Math.round(s.confidence),
  time: new Date(s.createdAt).toLocaleTimeString('vi-VN'),
  asset: 'gold'
}))

export const MARKET_PAIRS = {
  'XAU/USDT': { name: 'Vàng vĩnh cửu (Binance Futures)', base: 4005.50, change: 0.85, high: 4025.0, low: 3985.0 },
  'BTC/USDT': { name: 'Bitcoin (Binance)', base: 67482.35, change: 1.85, high: 68120.0, low: 66950.0 },
}

export const MARKET_TIMEFRAMES = {
  '5m': 300,
  '15m': 900,
}
