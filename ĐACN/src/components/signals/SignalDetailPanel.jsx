import { Activity, ShieldCheck, Signal, Brain, Sparkles, TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react'
import { formatSignalDate, formatSignalPrice, formatConfidence, formatRrRatio } from '../../data/signalUtils.js'

export function SignalDetailPanel({ signal, onOpenInspector }) {
  if (!signal) {
    return (
      <aside className="panel signal-detail-panel" aria-live="polite">
        <div className="signal-detail-empty">
          <Signal size={22} />
          <strong>Chưa chọn tín hiệu</strong>
          <span>Hãy nhấp vào một dòng trong bảng để xem phân tích chi tiết.</span>
        </div>
      </aside>
    )
  }

  const isLong = signal.direction === 'LONG' || signal.type === 'BUY'
  const isApproved = signal.status === 'APPROVED' || signal.status === 'ACTIVE'
  const entryPrice = signal.entry_price || signal.price || 0
  const stopLoss = signal.stop_loss || signal.stop || 0
  const takeProfit = signal.take_profit || signal.target || 0
  const deltaSl = signal.delta_sl || Math.abs(entryPrice - stopLoss) || 0
  const deltaTp = signal.delta_tp || Math.abs(takeProfit - entryPrice) || 0
  const rrRatio = signal.rr_ratio || (deltaSl > 0 ? (deltaTp / deltaSl) : 1.5)
  const confidence = signal.confidence <= 1 ? signal.confidence * 100 : signal.confidence
  const matchedCount = signal.matched_count || 14

  return (
    <aside className="panel signal-detail-panel" aria-live="polite">
      {/* Heading */}
      <div className="signal-detail-heading">
        <div>
          <div className="panel-kicker">AI SIGNAL BREAKDOWN</div>
          <h2>Chi tiết tín hiệu</h2>
        </div>
        <span className={`signal-type-badge ${isLong ? 'type-buy' : 'type-sell'}`}>
          {isLong ? <TrendingUp size={12} className="inline mr-1" /> : <TrendingDown size={12} className="inline mr-1" />}
          {isLong ? 'BUY / LONG' : 'SELL / SHORT'}
        </span>
      </div>

      {/* Symbol & Approval Status */}
      <div className="detail-pair-row">
        <div>
          <strong>{signal.symbol || signal.pair || 'BTC/USDT'}</strong>
          <span>Khung M5 · Binance Public API</span>
        </div>
        <span className={`signal-status ${isApproved ? 'status-active' : 'status-stop'}`}>
          <i />
          {isApproved ? 'ĐÃ DUYỆT' : 'BỊ TỪ CHỐI'}
        </span>
      </div>

      {/* Entry, SL, TP Grid */}
      <div className="detail-price-grid">
        <div>
          <span>GIÁ ENTRY (VÀO LỆNH)</span>
          <strong className="text-white">${formatSignalPrice(entryPrice)}</strong>
        </div>
        <div>
          <span>THỜI ĐIỂM ĐÓNG NẾN</span>
          <strong>{formatSignalDate(signal.timestamp_unix ? signal.timestamp_unix * 1000 : signal.createdAt)}</strong>
        </div>
      </div>

      {/* SL and TP Cards */}
      <div className="grid grid-cols-2 gap-2 my-3">
        <div className="p-2.5 bg-[#161B22] border border-[#F23645]/30 rounded-xl">
          <span className="text-[10px] text-[#F23645] block font-bold">STOP LOSS (CẮT LỖ)</span>
          <strong className="text-sm font-mono text-white block my-0.5">${formatSignalPrice(stopLoss)}</strong>
          <small className="text-[#8B949E] text-[10px]">Δ -${deltaSl.toFixed(1)} USD</small>
        </div>
        <div className="p-2.5 bg-[#161B22] border border-[#089981]/30 rounded-xl">
          <span className="text-[10px] text-[#089981] block font-bold">TAKE PROFIT (CHỐT LỜI)</span>
          <strong className="text-sm font-mono text-white block my-0.5">${formatSignalPrice(takeProfit)}</strong>
          <small className="text-[#8B949E] text-[10px]">Δ +${deltaTp.toFixed(1)} USD (R:R {formatRrRatio(rrRatio)})</small>
        </div>
      </div>

      {/* Confidence & Memory Consensus Track */}
      <div className="detail-confidence">
        <div className="flex justify-between items-center text-xs mb-1">
          <span className="text-[#8B949E] font-medium flex items-center gap-1">
            <Brain size={13} className="text-cyan-400" /> ĐỘ ĐỒNG THUẬN KÝ ỨC (FAISS)
          </span>
          <strong className="text-cyan-400 font-bold">{confidence.toFixed(1)}%</strong>
        </div>
        <div className="detail-confidence-track">
          <span style={{ width: `${Math.min(confidence, 100)}%` }} />
        </div>
        <div className="flex justify-between items-center text-[11px] text-[#8B949E] mt-1.5">
          <span>Khớp: <b className="text-white">{matchedCount} mẫu hình</b> lịch sử</span>
          <span>Chuẩn: <b className="text-white">Cosine $\ge$ 85%</b></span>
        </div>
      </div>

      {/* Risk Management & Reason */}
      <div className="p-3 bg-[#161B22] border border-[#21262D] rounded-xl my-3 text-xs">
        <div className="detail-section-label flex items-center gap-1.5 text-blue-400 font-semibold mb-1">
          <Target size={13} /> QUẢN TRỊ RỦI RO & PHÂN BỔ VỐN
        </div>
        <p className="text-[#C9D1D9] text-[11px] leading-relaxed">
          • <b>Rủi ro đề xuất:</b> 1.0% Vốn tài khoản ($100 USD trên $10,000 USD).<br />
          • <b>Khối lượng lệnh:</b> ~{(100 / (deltaSl + 1e-6)).toFixed(3)} BTC (Position Size).<br />
          • <b>Căn cứ Stop Loss:</b> Swing {isLong ? 'Low' : 'High'} 15 nến + Vùng đệm $20.0 USD.
        </p>
      </div>

      {/* Reject reason if any */}
      {signal.reject_reason && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl my-2 text-xs text-red-300 flex items-start gap-2">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-red-400" />
          <div>
            <b>Lý do từ chối:</b> {signal.reject_reason}
          </div>
        </div>
      )}

      {/* Pattern Inspector Action Button */}
      <div className="my-3">
        <button
          onClick={() => onOpenInspector && onOpenInspector(signal)}
          className="w-full py-2.5 px-3 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 hover:from-blue-600/30 hover:to-cyan-600/30 text-cyan-300 border border-cyan-500/40 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-cyan-500/10"
        >
          <Sparkles size={14} className="text-cyan-400" />
          MỞ PATTERN MEMORY INSPECTOR
        </button>
      </div>

      <div className="detail-disclaimer">
        <ShieldCheck size={13} /> Tín hiệu sinh ra từ thuật toán so khớp mẫu hình 49 chiều. Không phải khuyến nghị đầu tư.
      </div>
    </aside>
  )
}
