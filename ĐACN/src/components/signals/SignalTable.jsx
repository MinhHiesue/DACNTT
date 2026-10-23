import { Search, TrendingUp, TrendingDown, Eye } from 'lucide-react'
import { SIGNAL_STATUS_LABELS, formatSignalDate, formatSignalPrice, formatConfidence, formatRrRatio } from '../../data/signalUtils.js'

export function SignalTable({ signals, selectedId, onSelect, onOpenInspector }) {
  return (
    <div className="signal-table-scroll">
      <table className="ai-signal-table">
        <thead>
          <tr>
            <th>CẶP TIỀN</th>
            <th>HƯỚNG LỆNH</th>
            <th>GIÁ ENTRY</th>
            <th>STOP LOSS</th>
            <th>TAKE PROFIT</th>
            <th>R:R</th>
            <th>ĐỒNG THUẬN</th>
            <th>THỜI GIAN</th>
            <th>TRẠNG THÁI</th>
            <th className="text-right">SOI CHIẾU</th>
          </tr>
        </thead>
        <tbody>
          {signals.map((signal) => {
            const isLong = signal.direction === 'LONG' || signal.type === 'BUY'
            const isApproved = signal.status === 'APPROVED' || signal.status === 'ACTIVE'
            const deltaSl = signal.delta_sl || Math.abs(signal.entry_price - signal.stop_loss || signal.price - signal.stop) || 0
            const deltaTp = signal.delta_tp || Math.abs(signal.take_profit - signal.entry_price || signal.target - signal.price) || 0

            return (
              <tr
                key={signal.id}
                className={selectedId === signal.id ? 'selected-signal-row' : ''}
                onClick={() => onSelect(signal.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect(signal.id)
                  }
                }}
                tabIndex={0}
                aria-selected={selectedId === signal.id}
              >
                <td>
                  <strong className="table-pair">{signal.symbol || signal.pair}</strong>
                  <small>Binance M5</small>
                </td>
                <td>
                  <span className={`signal-type-badge ${isLong ? 'type-buy' : 'type-sell'}`}>
                    {isLong ? <TrendingUp size={12} className="inline mr-1" /> : <TrendingDown size={12} className="inline mr-1" />}
                    {isLong ? 'BUY / LONG' : 'SELL / SHORT'}
                  </span>
                </td>
                <td className="table-price font-mono font-semibold">
                  ${formatSignalPrice(signal.entry_price || signal.price)}
                </td>
                <td className="table-price text-[#F23645] font-mono text-xs">
                  ${formatSignalPrice(signal.stop_loss || signal.stop)}
                  <small className="block text-[#8B949E] text-[10px]">(-${deltaSl.toFixed(1)})</small>
                </td>
                <td className="table-price text-[#089981] font-mono text-xs">
                  ${formatSignalPrice(signal.take_profit || signal.target)}
                  <small className="block text-[#8B949E] text-[10px]">(+${deltaTp.toFixed(1)})</small>
                </td>
                <td className="font-semibold text-xs text-white">
                  {formatRrRatio(signal.rr_ratio || 1.5)}
                </td>
                <td>
                  <div className="confidence-cell">
                    <span>{formatConfidence(signal.confidence)}</span>
                    <i>
                      <b style={{ width: `${Math.min(signal.confidence <= 1 ? signal.confidence * 100 : signal.confidence, 100)}%` }} />
                    </i>
                  </div>
                </td>
                <td className="table-time text-xs text-[#8B949E]">
                  {formatSignalDate(signal.timestamp_unix ? signal.timestamp_unix * 1000 : signal.createdAt)}
                </td>
                <td>
                  <span className={`signal-status ${isApproved ? 'status-active' : 'status-stop'}`}>
                    <i />
                    {isApproved ? 'ĐƯỢC DUYỆT' : 'BỊ TỪ CHỐI'}
                  </span>
                </td>
                <td className="text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect(signal.id)
                      onOpenInspector(signal)
                    }}
                    className="p-1.5 px-2 text-[11px] font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg inline-flex items-center gap-1 transition-colors"
                    title="Soi chiếu ký ức mẫu hình"
                  >
                    <Eye size={12} /> Soi mẫu
                  </button>
                </td>
              </tr>
            )
          })}
          {!signals.length && (
            <tr>
              <td className="signals-empty" colSpan="10">
                <Search size={17} /> Không có tín hiệu phù hợp bộ lọc.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
