import { Zap } from 'lucide-react'

export function MarketTrendPanel({ timeframe, market, currentPrice, currentRsi, currentMacd, indicators }) {
  const movingAverage = indicators.ma[indicators.ma.length - 1]?.value ?? currentPrice
  const isUp = market.change >= 0
  const trend = isUp ? 'TĂNG' : 'GIẢM'

  return (
    <article className="panel trend-panel">
      <div className="analysis-panel-heading"><div><div className="panel-kicker">MARKET BIAS · SAMPLE</div><h2>Nhận định xu hướng</h2></div><span className={`trend-badge ${isUp ? 'trend-up' : 'trend-down'}`}><span /> {trend}</span></div>
      <p className="trend-summary">{isUp ? `${market.name} đang giữ xu hướng tăng trên khung ${timeframe}.` : `${market.name} đang điều chỉnh nhẹ trên khung ${timeframe}.`}</p>
      <div className="trend-factors"><div><span>Động lượng</span><strong>{currentMacd >= 0 ? 'Tích cực' : 'Suy yếu'}</strong></div><div><span>RSI 14</span><strong>{currentRsi.toFixed(1)} · {currentRsi > 50 ? 'Trên trung tuyến' : 'Dưới trung tuyến'}</strong></div><div><span>Tín hiệu MA 20</span><strong>{currentPrice >= movingAverage ? 'Giá nằm trên MA' : 'Giá nằm dưới MA'}</strong></div></div>
      <div className="sample-disclaimer"><Zap size={13} /> Nhận định mô phỏng, không phải khuyến nghị giao dịch.</div>
    </article>
  )
}
