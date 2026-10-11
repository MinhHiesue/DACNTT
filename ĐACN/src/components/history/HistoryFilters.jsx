import { SIGNAL_STATUS_LABELS } from '../../data/signalUtils.js'

export function HistoryFilters({ type, status, resultCount, onTypeChange, onStatusChange }) {
  return (
    <div className="utility-filter-row">
      <label>LOẠI TÍN HIỆU<select aria-label="Lọc lịch sử theo loại" value={type} onChange={(event) => onTypeChange(event.target.value)}>
        <option value="ALL">Tất cả loại</option><option value="BUY">BUY</option><option value="SELL">SELL</option><option value="HOLD">HOLD</option>
      </select></label>
      <label>TRẠNG THÁI<select aria-label="Lọc lịch sử theo trạng thái" value={status} onChange={(event) => onStatusChange(event.target.value)}>
        <option value="ALL">Tất cả trạng thái</option>{Object.entries(SIGNAL_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      <span className="filter-result-count">{resultCount} bản ghi</span>
    </div>
  )
}
