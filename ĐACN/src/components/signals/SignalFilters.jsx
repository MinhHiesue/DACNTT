export function SignalFilters({ pair, type, time, onPairChange, onTypeChange, onTimeChange }) {
  return (
    <div className="signal-filters" aria-label="Bộ lọc tín hiệu">
      <label><span>CẶP TIỀN</span><select aria-label="Lọc theo cặp tiền" value={pair} onChange={(event) => onPairChange(event.target.value)}><option value="ALL">Tất cả cặp</option><option value="BTC/USDT">BTC/USDT</option><option value="ETH/USDT">ETH/USDT</option><option value="BNB/USDT">BNB/USDT</option></select></label>
      <label><span>LOẠI TÍN HIỆU</span><select aria-label="Lọc theo loại tín hiệu" value={type} onChange={(event) => onTypeChange(event.target.value)}><option value="ALL">Tất cả loại</option><option value="BUY">BUY</option><option value="SELL">SELL</option><option value="HOLD">HOLD</option></select></label>
      <label><span>THỜI GIAN</span><select aria-label="Lọc theo thời gian" value={time} onChange={(event) => onTimeChange(event.target.value)}><option value="24h">24 giờ qua</option><option value="7d">7 ngày qua</option><option value="30d">30 ngày qua</option><option value="all">Toàn bộ</option></select></label>
    </div>
  )
}
