/**
 * Dữ liệu chuẩn hóa thị trường & Tín hiệu Pattern-Matching AI.
 * Đồng bộ các trường dữ liệu với Signal_Trade Backend.
 */

export const ASSETS = {
  btc: { label: 'Bitcoin (Binance)', symbol: 'BTC / USDT', price: 67482.35, change: 1.85, color: '#f7931a' },
}

export const signalNow = Date.now()

export const AI_SIGNAL_DATA = [
  {
    id: 'sig-01',
    pair: 'BTC/USDT',
    symbol: 'BTCUSDT',
    type: 'BUY',
    direction: 'LONG',
    price: 67482.35,
    entry_price: 67482.35,
    stop: 67062.35,
    stop_loss: 67062.35,
    target: 68112.35,
    take_profit: 68112.35,
    delta_sl: 420.0,
    delta_tp: 630.0,
    rr_ratio: 1.50,
    suggested_lot: 0.24,
    confidence: 87.5,
    matched_count: 14,
    minutesAgo: 3,
    status: 'APPROVED',
    analysis: 'FAISS so khớp 14 mẫu hình thắng trong Memory Bank với độ đồng thuận 87.5%. Cấu trúc 15 nến setup hình thành đáy Swing Low vững chắc tại 67,082.35.'
  },
  {
    id: 'sig-02',
    pair: 'BTC/USDT',
    symbol: 'BTCUSDT',
    type: 'SELL',
    direction: 'SHORT',
    price: 66890.10,
    entry_price: 66890.10,
    stop: 67240.10,
    stop_loss: 67240.10,
    target: 66365.10,
    take_profit: 66365.10,
    delta_sl: 350.0,
    delta_tp: 525.0,
    rr_ratio: 1.50,
    suggested_lot: 0.28,
    confidence: 83.0,
    matched_count: 12,
    minutesAgo: 35,
    status: 'APPROVED',
    analysis: 'So khớp 12 mẫu hình lịch sử tương đồng 83%. Nến M5 đóng cửa dưới ngưỡng kháng cự Swing High.'
  },
  {
    id: 'sig-03',
    pair: 'BTC/USDT',
    symbol: 'BTCUSDT',
    type: 'BUY',
    direction: 'LONG',
    price: 66150.00,
    entry_price: 66150.00,
    stop: 66120.00,
    stop_loss: 66120.00,
    target: 66195.00,
    take_profit: 66195.00,
    delta_sl: 30.0,
    delta_tp: 45.0,
    rr_ratio: 1.50,
    suggested_lot: 0.0,
    confidence: 88.0,
    matched_count: 15,
    minutesAgo: 90,
    status: 'REJECTED',
    reject_reason: 'SL_TOO_TIGHT (Δ 30.0 USD < 50.0 USD)',
    analysis: 'Tín hiệu bị từ chối bởi Risk Manager do khoảng cách Stop Loss quá hẹp (30 USD), có nguy cơ dính trượt giá.'
  },
  {
    id: 'sig-04',
    pair: 'BTC/USDT',
    symbol: 'BTCUSDT',
    type: 'BUY',
    direction: 'LONG',
    price: 65920.00,
    entry_price: 65920.00,
    stop: 65450.00,
    stop_loss: 65450.00,
    target: 66625.00,
    take_profit: 66625.00,
    delta_sl: 470.0,
    delta_tp: 705.0,
    rr_ratio: 1.50,
    suggested_lot: 0.21,
    confidence: 91.2,
    matched_count: 18,
    minutesAgo: 210,
    status: 'APPROVED',
    analysis: 'Độ tự tin rất cao (91.2%), 18 mẫu hình lịch sử đồng thuận kịch bản tăng trưởng mạnh.'
  }
].map((signal) => ({ ...signal, createdAt: signalNow - signal.minutesAgo * 60_000 }))

export const signals = AI_SIGNAL_DATA.map((s) => ({
  pair: s.pair,
  name: 'Bitcoin (Binance)',
  type: s.type === 'BUY' ? 'MUA' : 'BÁN',
  price: s.price.toLocaleString('en-US', { minimumFractionDigits: 2 }),
  target: s.target.toLocaleString('en-US', { minimumFractionDigits: 2 }),
  stop: s.stop.toLocaleString('en-US', { minimumFractionDigits: 2 }),
  confidence: Math.round(s.confidence),
  time: new Date(s.createdAt).toLocaleTimeString('vi-VN'),
  asset: 'btc'
}))

export const MARKET_PAIRS = {
  'BTC/USDT': { name: 'Bitcoin (Binance)', base: 67482.35, change: 1.85, high: 68120.0, low: 66950.0 },
}

export const MARKET_TIMEFRAMES = {
  '5m': 300,
  '15m': 900,
}
