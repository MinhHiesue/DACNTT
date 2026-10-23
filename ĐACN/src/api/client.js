/**
 * Central API Client giao tiếp trực tiếp với Signal_Trade Backend (FastAPI).
 * Tự động xử lý lỗi, timeout, và dự phòng an toàn.
 */
import { ENDPOINTS } from './endpoints.js'

async function apiRequest(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }
    return await res.json()
  } catch (err) {
    clearTimeout(timeoutId)
    console.warn(`[API Client] Lỗi kết nối tới ${url}:`, err.message)
    throw err
  }
}

/**
 * Kiểm tra trạng thái máy chủ Backend & Binance API.
 */
export async function fetchHealth() {
  return await apiRequest(ENDPOINTS.HEALTH)
}

/**
 * Lấy danh sách nến M5 từ Binance cho TradingView Chart.
 * @param {string} symbol - Cặp giao dịch (BTCUSDT)
 * @param {number} limit - Số lượng nến (10-500)
 */
export async function fetchKlines(symbol = 'BTCUSDT', limit = 150) {
  const url = `${ENDPOINTS.KLINES}?symbol=${encodeURIComponent(symbol)}&limit=${limit}`
  return await apiRequest(url)
}

/**
 * Lấy đánh giá phân vị Volume Regime P20 - P85 của nến M5 hiện tại.
 */
export async function fetchVolumeRegime(symbol = 'BTCUSDT') {
  const url = `${ENDPOINTS.VOLUME_REGIME}?symbol=${encodeURIComponent(symbol)}`
  return await apiRequest(url)
}

/**
 * Lấy tín hiệu giao dịch mới nhất được phê duyệt hoặc từ chối.
 */
export async function fetchLatestSignal() {
  return await apiRequest(ENDPOINTS.SIGNALS_LATEST)
}

/**
 * Kích hoạt quét mẫu hình tức thì trên nến M5 vừa đóng.
 */
export async function scanLatestSignal() {
  return await apiRequest(ENDPOINTS.SIGNALS_SCAN, { method: 'POST' })
}

/**
 * Lấy danh sách lịch sử tín hiệu đã phát ra gần đây.
 */
export async function fetchSignalsHistory() {
  return await apiRequest(ENDPOINTS.SIGNALS_HISTORY)
}

/**
 * Lấy dữ liệu soi chiếu ký ức mẫu hình (Pattern Memory Inspector).
 * Trả về 15 nến setup hiện tại và các mẫu hình thắng tương đồng nhất từ FAISS.
 */
export async function fetchPatternInspector() {
  return await apiRequest(ENDPOINTS.PATTERNS_INSPECTOR)
}

/**
 * Lấy báo cáo chỉ số hiệu suất Backtest (Winrate, Profit Factor, Drawdown, Sharpe, Sortino).
 */
export async function fetchPerformanceSummary() {
  return await apiRequest(ENDPOINTS.PERFORMANCE_SUMMARY)
}

/**
 * Lấy danh sách nhật ký các lệnh giao dịch kiểm thử Out-of-sample.
 */
export async function fetchPerformanceTrades(limit = 50, offset = 0) {
  const url = `${ENDPOINTS.PERFORMANCE_TRADES}?limit=${limit}&offset=${offset}`
  return await apiRequest(url)
}

/**
 * Gửi cảnh báo thử nghiệm có kèm ảnh biểu đồ snapshot về Telegram.
 */
export async function sendTelegramTestAlert() {
  return await apiRequest(ENDPOINTS.TELEGRAM_TEST, { method: 'POST' })
}
