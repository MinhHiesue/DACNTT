export function PerformanceMetrics({ model }) {
  return (
    <div className="performance-metrics">
      <article className="panel performance-metric"><span>ĐỘ CHÍNH XÁC</span><strong>{model.accuracy}</strong><small>+2.6% so với kỳ trước</small></article>
      <article className="panel performance-metric"><span>TỶ LỆ THẮNG</span><strong>{model.winRate}</strong><small>Trên tín hiệu đã hoàn tất</small></article>
      <article className="panel performance-metric"><span>TÍN HIỆU ĐÃ ĐÁNH GIÁ</span><strong>{model.signals}</strong><small>Trong 30 ngày gần nhất</small></article>
      <article className="panel performance-metric"><span>HIỆU SUẤT MÔ PHỎNG</span><strong className="metric-positive">{model.pnl}</strong><small>Không tính phí giao dịch</small></article>
    </div>
  )
}
