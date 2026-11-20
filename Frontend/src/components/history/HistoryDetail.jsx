import { Clock3 } from 'lucide-react'
import { formatConfidence } from '../../data/signalUtils.js'

function formatMetric(value, digits, signed = false) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  const formatted = value.toFixed(digits)
  return signed && value > 0 ? `+${formatted}` : formatted
}

export function HistoryDetail({ signal }) {
  return (
    <aside className="panel history-detail">
      {signal ? <>
        <div className="panel-kicker">ARCHIVE RECORD</div>
        <h2>{signal.pair}</h2>
        <span className={`signal-type-badge type-${signal.type.toLowerCase()}`}>{signal.type}</span>
        <div className="history-detail-values">
          <div><span>ĐỘ TIN CẬY</span><strong>{formatConfidence(signal.confidence)}</strong></div>
          <div><span>RSI (14)</span><strong>{formatMetric(signal.rsi, 1)}</strong></div>
          <div><span>MACD</span><strong>{formatMetric(signal.macd, 2, true)}</strong></div>
        </div>
        <p>{signal.analysis}</p>
        <div className="history-detail-trend">Xu hướng ghi nhận <strong>{signal.trend}</strong></div>
      </> : <div className="signal-detail-empty"><Clock3 size={21} /><strong>Chưa chọn bản ghi</strong></div>}
    </aside>
  )
}
