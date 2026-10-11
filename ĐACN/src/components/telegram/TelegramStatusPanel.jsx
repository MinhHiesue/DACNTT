import { Bot } from 'lucide-react'

export function TelegramStatusPanel({ connected }) {
  return (
    <aside className="panel telegram-status-panel">
      <div className="panel-kicker">DELIVERY STATUS</div>
      <h2>Trạng thái thông báo</h2>
      <div className="telegram-status-line">
        <span className={`service-icon ${connected ? 'service-green' : 'service-red'}`}><Bot size={17} /></span>
        <div><strong>{connected ? 'Bot sẵn sàng' : 'Bot đang tắt'}</strong><small>{connected ? 'Chế độ mô phỏng đang hoạt động' : 'Bật công tắc để kích hoạt demo'}</small></div>
      </div>
      <div className="telegram-logs">
        <div className="detail-section-label">NHẬT KÝ GẦN ĐÂY</div>
        <div><i className="status-target-dot" /><span>Tín hiệu BTC/USDT · BUY</span><time>10:42</time></div>
        <div><i className="status-watch-dot" /><span>Kiểm tra kết nối mô phỏng</span><time>10:30</time></div>
        <div><i className="status-target-dot" /><span>Tín hiệu XAU/USD · BUY</span><time>09:58</time></div>
      </div>
    </aside>
  )
}
