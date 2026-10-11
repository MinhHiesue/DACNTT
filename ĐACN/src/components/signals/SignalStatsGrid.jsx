import { Activity, ArrowDownRight, ArrowUpRight } from 'lucide-react'

export function SignalStatsGrid({ signals, buyCount, sellCount, holdCount }) {
  return (
    <section className="signal-stats-grid" aria-label="Thống kê tín hiệu">
      <article className="signal-stat-card"><span>TỔNG SỐ TÍN HIỆU</span><strong>{signals.length.toString().padStart(2, '0')}</strong><small>Trong dữ liệu mẫu</small></article>
      <article className="signal-stat-card stat-buy"><span>TÍN HIỆU BUY</span><strong>{buyCount.toString().padStart(2, '0')}</strong><small><ArrowUpRight size={13} /> Xu hướng tăng</small></article>
      <article className="signal-stat-card stat-sell"><span>TÍN HIỆU SELL</span><strong>{sellCount.toString().padStart(2, '0')}</strong><small><ArrowDownRight size={13} /> Xu hướng giảm</small></article>
      <article className="signal-stat-card stat-hold"><span>TÍN HIỆU HOLD</span><strong>{holdCount.toString().padStart(2, '0')}</strong><small><Activity size={12} /> Chờ xác nhận</small></article>
    </section>
  )
}
