export function SignalFilters({ direction, status, time, onDirectionChange, onStatusChange, onTimeChange }) {
  return (
    <div className="signal-filters" aria-label="Bộ lọc tín hiệu">
      <label>
        <span>HƯỚNG LỆNH</span>
        <select
          aria-label="Lọc theo hướng lệnh"
          value={direction}
          onChange={(event) => onDirectionChange(event.target.value)}
        >
          <option value="ALL">Tất cả hướng</option>
          <option value="BUY">BUY / LONG</option>
          <option value="SELL">SELL / SHORT</option>
        </select>
      </label>

      <label>
        <span>TRẠNG THÁI DUYỆT</span>
        <select
          aria-label="Lọc theo trạng thái duyệt"
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="APPROVED">Đã duyệt (Thỏa mãn R:R)</option>
          <option value="REJECTED">Bị từ chối</option>
        </select>
      </label>

      <label>
        <span>THỜI GIAN</span>
        <select
          aria-label="Lọc theo thời gian"
          value={time}
          onChange={(event) => onTimeChange(event.target.value)}
        >
          <option value="24h">24 giờ qua</option>
          <option value="7d">7 ngày qua</option>
          <option value="30d">30 ngày qua</option>
          <option value="all">Toàn bộ</option>
        </select>
      </label>
    </div>
  )
}
