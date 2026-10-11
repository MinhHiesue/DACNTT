import { Search } from 'lucide-react'
import { SIGNAL_STATUS_LABELS, formatSignalDate, formatSignalPrice } from '../../data/signalUtils.js'

export function SignalTable({ signals, selectedId, onSelect }) {
  return (
    <div className="signal-table-scroll">
      <table className="ai-signal-table">
        <thead><tr><th>CẶP TIỀN</th><th>TÍN HIỆU</th><th>GIÁ PHÁT HIỆN</th><th>ĐỘ TIN CẬY</th><th>THỜI GIAN TẠO</th><th>TRẠNG THÁI</th></tr></thead>
        <tbody>
          {signals.map((signal) => <tr key={signal.id} className={selectedId === signal.id ? 'selected-signal-row' : ''} onClick={() => onSelect(signal.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(signal.id) } }} tabIndex={0} aria-selected={selectedId === signal.id}>
            <td><strong className="table-pair">{signal.pair}</strong><small>{signal.pair.startsWith('BTC') ? 'Bitcoin' : signal.pair.startsWith('ETH') ? 'Ethereum' : 'BNB'}</small></td>
            <td><span className={`signal-type-badge type-${signal.type.toLowerCase()}`}>{signal.type}</span></td>
            <td className="table-price">${formatSignalPrice(signal.price)}</td>
            <td><div className="confidence-cell"><span>{signal.confidence}%</span><i><b style={{ width: `${signal.confidence}%` }} /></i></div></td>
            <td className="table-time">{formatSignalDate(signal.createdAt)}</td>
            <td><span className={`signal-status status-${signal.status.toLowerCase()}`}><i />{SIGNAL_STATUS_LABELS[signal.status]}</span></td>
          </tr>)}
          {!signals.length && <tr><td className="signals-empty" colSpan="6"><Search size={17} />Không có tín hiệu khớp bộ lọc.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
