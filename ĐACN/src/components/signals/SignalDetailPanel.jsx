import { Activity, ShieldCheck, Signal } from 'lucide-react'
import { SIGNAL_STATUS_LABELS, formatSignalDate, formatSignalPrice } from '../../data/signalUtils.js'

export function SignalDetailPanel({ signal }) {
  return (
    <aside className="panel signal-detail-panel" aria-live="polite">
      {signal ? <>
        <div className="signal-detail-heading"><div><div className="panel-kicker">SIGNAL BREAKDOWN</div><h2>Chi tiết tín hiệu</h2></div><span className={`signal-type-badge type-${signal.type.toLowerCase()}`}>{signal.type}</span></div>
        <div className="detail-pair-row"><div><strong>{signal.pair}</strong><span>{signal.type === 'HOLD' ? 'Quan sát thị trường' : `${signal.type === 'BUY' ? 'Tín hiệu mua' : 'Tín hiệu bán'} · ${signal.confidence}% tin cậy`}</span></div><span className={`signal-status status-${signal.status.toLowerCase()}`}><i />{SIGNAL_STATUS_LABELS[signal.status]}</span></div>
        <div className="detail-price-grid"><div><span>GIÁ PHÁT HIỆN</span><strong>${formatSignalPrice(signal.price)}</strong></div><div><span>THỜI GIAN</span><strong>{formatSignalDate(signal.createdAt)}</strong></div></div>
        <div className="detail-confidence"><div><span>ĐỘ TIN CẬY DỰ ĐOÁN</span><strong>{signal.confidence}%</strong></div><div className="detail-confidence-track"><span style={{ width: `${signal.confidence}%` }} /></div></div>
        <div className="detail-analysis"><div className="detail-section-label"><Activity size={13} /> PHÂN TÍCH</div><p>{signal.analysis}</p></div>
        <div className="detail-indicators"><div className="detail-section-label">CHỈ BÁO KỸ THUẬT</div><div className="detail-indicator-grid"><div><span>RSI (14)</span><strong className={signal.rsi >= 70 ? 'indicator-warn' : signal.rsi <= 30 ? 'indicator-positive' : ''}>{signal.rsi.toFixed(1)}</strong><small>{signal.rsi >= 70 ? 'Quá mua' : signal.rsi <= 30 ? 'Quá bán' : 'Trung tính'}</small></div><div><span>MACD</span><strong className={signal.macd >= 0 ? 'indicator-positive' : 'indicator-warn'}>{signal.macd >= 0 ? '+' : ''}{signal.macd.toFixed(2)}</strong><small>{signal.macd >= 0 ? 'Động lượng tăng' : 'Động lượng giảm'}</small></div></div></div>
        <div className="detail-trend"><span>NHẬN ĐỊNH XU HƯỚNG</span><strong className={signal.trend.toLowerCase().includes('giảm') || signal.trend.toLowerCase().includes('điều chỉnh') ? 'trend-text-down' : signal.trend.toLowerCase().includes('tăng') || signal.trend.toLowerCase().includes('phục hồi') ? 'trend-text-up' : ''}>{signal.trend}</strong></div>
        {signal.type !== 'HOLD' && <div className="detail-levels"><span>Mục tiêu <b>${formatSignalPrice(signal.target)}</b></span><span>Dừng lỗ <b>${formatSignalPrice(signal.stop)}</b></span></div>}
        <div className="detail-disclaimer"><ShieldCheck size={13} /> Phân tích minh họa từ dữ liệu mẫu. Không phải khuyến nghị đầu tư.</div>
      </> : <div className="signal-detail-empty"><Signal size={22} /><strong>Chưa có tín hiệu phù hợp</strong><span>Hãy đổi bộ lọc để xem tín hiệu.</span></div>}
    </aside>
  )
}
