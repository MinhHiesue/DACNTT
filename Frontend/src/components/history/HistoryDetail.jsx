import { Clock3 } from 'lucide-react'
export function HistoryDetail({ signal }) {
  return (
    <aside className="panel history-detail">
      {signal ? <>
        <div className="panel-kicker">ARCHIVE RECORD</div>
        <h2>{signal.pair}</h2>
        <span className={`signal-type-badge type-${signal.type.toLowerCase()}`}>{signal.type}</span>
        <div className="history-detail-values">
          <div><span>ĐỘ TIN CẬY</span><strong>{signal.confidence}%</strong></div>
          <div><span>RSI (14)</span><strong>{signal.rsi.toFixed(1)}</strong></div>
          <div><span>MACD</span><strong>{signal.macd >= 0 ? '+' : ''}{signal.macd.toFixed(2)}</strong></div>
        </div>
        <p>{signal.analysis}</p>
        <div className="history-detail-trend">Xu hướng ghi nhận <strong>{signal.trend}</strong></div>
      </> : <div className="signal-detail-empty"><Clock3 size={21} /><strong>Chưa chọn bản ghi</strong></div>}
    </aside>
  )
}
