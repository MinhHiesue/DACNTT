import { Search } from 'lucide-react'
import { SIGNAL_STATUS_LABELS, formatSignalDate, formatSignalPrice } from '../../data/signalUtils.js'

export function HistoryTable({ rows, selectedId, onSelect }) {
  return (
    <section className="panel utility-table-panel">
      <div className="utility-table-scroll">
        <table className="ai-signal-table">
          <thead><tr><th>CẶP TIỀN</th><th>TÍN HIỆU</th><th>GIÁ PHÁT HIỆN</th><th>KẾT QUẢ</th><th>THỜI GIAN</th></tr></thead>
          <tbody>
            {rows.map((signal) => <tr
              key={signal.id}
              className={selectedId === signal.id ? 'selected-signal-row' : ''}
              tabIndex={0}
              aria-selected={selectedId === signal.id}
              onClick={() => onSelect(signal.id)}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(signal.id) } }}
            >
              <td><strong className="table-pair">{signal.pair}</strong><small>{formatSignalDate(signal.createdAt)}</small></td>
              <td><span className={`signal-type-badge type-${signal.type.toLowerCase()}`}>{signal.type}</span></td>
              <td className="table-price">${formatSignalPrice(signal.price)}</td>
              <td><span className={`signal-status status-${signal.status.toLowerCase()}`}><i />{SIGNAL_STATUS_LABELS[signal.status]}</span></td>
              <td className="table-time">{formatSignalDate(signal.createdAt)}</td>
            </tr>)}
            {!rows.length && <tr><td colSpan="5" className="signals-empty"><Search size={17} />Không có bản ghi phù hợp.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}
