import { ArrowDownRight, ArrowUpRight, CheckCircle2, AlertTriangle, Layers } from 'lucide-react'

export function SignalStatsGrid({ totalCount, approvedCount, buyCount, sellCount, rejectedCount }) {
  return (
    <section className="signal-stats-grid" aria-label="Thống kê tín hiệu">
      <article className="signal-stat-card">
        <span className="flex items-center gap-1.5"><Layers size={13} className="text-blue-400" /> TỔNG TÍN HIỆU</span>
        <strong>{totalCount.toString().padStart(2, '0')}</strong>
        <small>Khung Binance M5</small>
      </article>

      <article className="signal-stat-card stat-buy">
        <span className="flex items-center gap-1.5"><ArrowUpRight size={13} /> TÍN HIỆU BUY / LONG</span>
        <strong>{buyCount.toString().padStart(2, '0')}</strong>
        <small>Đồng thuận tăng trưởng</small>
      </article>

      <article className="signal-stat-card stat-sell">
        <span className="flex items-center gap-1.5"><ArrowDownRight size={13} /> TÍN HIỆU SELL / SHORT</span>
        <strong>{sellCount.toString().padStart(2, '0')}</strong>
        <small>Đồng thuận sụt giảm</small>
      </article>

      <article className="signal-stat-card">
        <span className="flex items-center gap-1.5 text-emerald-400"><CheckCircle2 size={13} /> ĐÃ DUYỆT (APPROVED)</span>
        <strong className="text-emerald-400">{approvedCount.toString().padStart(2, '0')}</strong>
        <small>Thỏa mãn R:R &ge; 1.5 & Vol</small>
      </article>

      <article className="signal-stat-card">
        <span className="flex items-center gap-1.5 text-rose-400"><AlertTriangle size={13} /> TỪ CHỐI (REJECTED)</span>
        <strong className="text-rose-400">{rejectedCount.toString().padStart(2, '0')}</strong>
        <small>Chặn bởi Risk Manager</small>
      </article>
    </section>
  )
}
