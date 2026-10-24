/**
 * Tiện ích định dạng thông số kỹ thuật tín hiệu cho Dashboard.
 */

export function formatSignalPrice(price) {
  if (price === undefined || price === null || isNaN(price)) return '0.00'
  return Number(price).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatSignalDate(timestamp) {
  if (!timestamp) return '--:--'
  const d = new Date(timestamp)
  if (isNaN(d.getTime())) return String(timestamp)
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function formatConfidence(conf) {
  if (conf === undefined || conf === null || isNaN(conf)) return '0%'
  const val = conf <= 1.0 ? conf * 100 : conf
  return `${val.toFixed(1)}%`
}

export function formatRrRatio(rr) {
  if (rr === undefined || rr === null || isNaN(rr)) return '0.00'
  return `${Number(rr).toFixed(2)}`
}

export const SIGNAL_STATUS_LABELS = {
  APPROVED: '✅ Được phê duyệt',
  REJECTED: '⚠️ Bị từ chối',
  // Backward compatibility
  ACTIVE: 'Đang theo dõi',
  TARGET: 'Đạt Take Profit',
  STOP: 'Cắn Stop Loss',
  WATCH: 'Quan sát',
  EXPIRED: 'Hết hạn',
}
