export function HistoryFilters({ type, status, resultCount, onTypeChange, onStatusChange }) {
  return (
    <div className="utility-filter-row">
      <label>
        HƯỚNG LỆNH
        <select
          aria-label="Lọc lịch sử theo loại"
          value={type}
          onChange={(event) => onTypeChange(event.target.value)}
        >
          <option value="ALL">Tất cả hướng</option>
          <option value="BUY">BUY / LONG</option>
          <option value="SELL">SELL / SHORT</option>
        </select>
      </label>
      <label>
        TRẠNG THÁI
        <select
          aria-label="Lọc lịch sử theo trạng thái"
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="APPROVED">Đã duyệt (Thỏa mãn R:R)</option>
          <option value="REJECTED">Bị từ chối</option>
        </select>
      </label>
      <span className="filter-result-count">{resultCount} bản ghi</span>
    </div>
  )
}
