import { Activity, ArrowRight, BarChart3, Bot, Check, Zap } from 'lucide-react'

export function SystemActivitySection({ onNavigate }) {
  return (
    <section className="bottom-grid">
      <article className="panel system-panel"><div className="bottom-panel-title"><div><div className="panel-kicker">LIVE MONITOR</div><h2>Trạng thái hệ thống</h2></div><span className="system-live"><span className="online-pulse" /> VẬN HÀNH</span></div><div className="system-services"><div className="service-item"><span className="service-icon service-green"><Activity size={15} /></span><div><strong>Engine phân tích</strong><small>Phân tích thị trường</small></div><span className="service-status">Bình thường</span></div><div className="service-item"><span className="service-icon service-blue"><Bot size={15} /></span><div><strong>Telegram Bot</strong><small>Thông báo tín hiệu</small></div><span className="service-status">Đã kết nối</span></div><div className="service-item"><span className="service-icon service-gold"><BarChart3 size={15} /></span><div><strong>Market feed</strong><small>Nguồn dữ liệu mô phỏng</small></div><span className="service-status">Hoạt động</span></div></div></article>
      <article className="panel activity-panel"><div className="bottom-panel-title"><div><div className="panel-kicker">RECENT ACTIVITY</div><h2>Hoạt động mới nhất</h2></div><button className="text-link" onClick={() => onNavigate('Lịch sử')}>Nhật ký <ArrowRight size={13} /></button></div><div className="activity-entry"><span className="activity-marker activity-marker-gold"><Zap size={13} /></span><div><strong>Tín hiệu mua XAU/USD</strong><small>Độ tin cậy 87% · Mục tiêu $2,358.00</small></div><time>2 phút</time></div><div className="activity-entry"><span className="activity-marker activity-marker-blue"><Check size={13} /></span><div><strong>Gửi thông báo Telegram thành công</strong><small>Tín hiệu BTC/USDT đã được chuyển tiếp</small></div><time>8 phút</time></div></article>
    </section>
  )
}
