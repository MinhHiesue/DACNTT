export function formatSignalPrice(price) {
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatSignalDate(timestamp) {
  return new Date(timestamp).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

export const SIGNAL_STATUS_LABELS = {
  ACTIVE: 'Đang hoạt động',
  TARGET: 'Đã chạm mục tiêu',
  STOP: 'Dừng lỗ',
  WATCH: 'Đang theo dõi',
  EXPIRED: 'Hết hạn',
}
