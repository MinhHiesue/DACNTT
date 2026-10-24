export const SETTINGS_GROUPS = {
  Chung: {
    heading: 'Tuỳ chọn giao diện',
    options: [
      { key: 'compact', title: 'Bố cục gọn', description: 'Giảm khoảng cách trong toàn bộ giao diện' },
      { key: 'sound', title: 'Âm báo trong giao diện', description: 'Chỉ áp dụng khi có thông báo mô phỏng' },
    ],
  },
  'Tín hiệu': {
    heading: 'Loại tín hiệu nhận',
    options: [
      { key: 'buy', title: 'Tín hiệu BUY', description: 'Hiển thị và thông báo tín hiệu mua' },
      { key: 'sell', title: 'Tín hiệu SELL', description: 'Hiển thị và thông báo tín hiệu bán' },
      { key: 'hold', title: 'Tín hiệu HOLD', description: 'Hiển thị tín hiệu chờ xác nhận' },
    ],
  },
  'Thông báo': {
    heading: 'Kênh thông báo',
    options: [
      { key: 'desktop', title: 'Thông báo trong ứng dụng', description: 'Hiển thị thông báo tại Header' },
      { key: 'telegram', title: 'Telegram Bot', description: 'Cho phép gửi tín hiệu đến bot đã cấu hình' },
    ],
  },
}
