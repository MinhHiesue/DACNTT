import { Sparkles, Brain, RefreshCw, ShieldCheck, TrendingUp, TrendingDown, Eye, CheckCircle2, AlertTriangle } from 'lucide-react'
import { formatSignalPrice, formatConfidence, formatRrRatio, formatSignalDate } from '../../data/signalUtils.js'

export function ActiveSignalHero({ signal, onOpenInspector, onTriggerScan, isScanning }) {
  if (!signal) {
    return (
      <section className="p-6 bg-[#0D1117] border border-[#21262D] rounded-2xl mb-6 text-center">
        <div className="flex flex-col items-center justify-center py-6 text-[#8B949E]">
          <Brain size={36} className="text-[#30363D] mb-3 animate-pulse" />
          <h3 className="text-base font-semibold text-white">Chưa có tín hiệu nào</h3>
          <p className="text-xs text-[#8B949E] mt-1 max-w-md">
            Hệ thống đang theo dõi luồng nến Binance M5 và sẵn sàng quét khi nến đóng cửa.
          </p>
          <button
            onClick={onTriggerScan}
            disabled={isScanning}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw size={13} className={isScanning ? 'animate-spin' : ''} />
            {isScanning ? 'Đang phân tích 15 nến gần nhất...' : 'Quét nến hiện tại'}
          </button>
        </div>
      </section>
    )
  }

  const isLong = signal.direction === 'LONG' || signal.type === 'BUY'
  const isApproved = signal.status === 'APPROVED' || signal.status === 'ACTIVE'
  const entryPrice = signal.entry_price || signal.price || 0
  const stopLoss = signal.stop_loss || signal.stop || 0
  const takeProfit = signal.take_profit || signal.target || 0
  const deltaSl = signal.delta_sl || Math.abs(entryPrice - stopLoss) || 0
  const deltaTp = signal.delta_tp || Math.abs(takeProfit - entryPrice) || 0
  const rrRatio = signal.rr_ratio || (deltaSl > 0 ? deltaTp / deltaSl : 1.5)
  const confidence = signal.confidence <= 1 ? signal.confidence * 100 : signal.confidence
  const matchedCount = signal.matched_count || 14
  const timeFormatted = formatSignalDate(signal.timestamp_unix ? signal.timestamp_unix * 1000 : signal.createdAt)

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0D1117] via-[#161B22] to-[#0D1117] border border-[#30363D] rounded-2xl p-6 mb-6 shadow-xl">
      {/* Background Glow */}
      <div
        className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none ${
          isLong ? 'bg-[#089981]' : 'bg-[#F23645]'
        }`}
      />

      <div className="relative z-10">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#21262D]">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLong ? 'bg-[#089981]' : 'bg-[#F23645]'}`} />
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isLong ? 'bg-[#089981]' : 'bg-[#F23645]'}`} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-widest text-[#8B949E] uppercase">
                  ACTIVE AI SIGNAL HERO
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-[#21262D] text-white border border-[#30363D]">
                  {signal.symbol || 'XAU/USDT'} · M5
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
                Tín hiệu mới nhất từ FAISS Memory
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onTriggerScan}
              disabled={isScanning}
              className="px-3.5 py-1.5 bg-[#21262D] hover:bg-[#30363D] text-[#C9D1D9] hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border border-[#30363D] disabled:opacity-50"
              title="Quét mẫu hình cho nến M5 mới nhất"
            >
              <RefreshCw size={13} className={isScanning ? 'animate-spin text-cyan-400' : ''} />
              {isScanning ? 'Đang quét...' : 'Quét lại nến M5'}
            </button>

            <button
              onClick={() => onOpenInspector(signal)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md hover:shadow-cyan-500/20"
            >
              <Sparkles size={13} />
              Soi chiếu ký ức (Inspector)
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5">
          {/* Col 1: Direction & Status (4 cols) */}
          <div className="lg:col-span-4 flex flex-col justify-between p-4 bg-[#161B22]/80 border border-[#21262D] rounded-xl">
            <div>
              <div className="flex items-center justify-between text-xs text-[#8B949E] mb-2">
                <span>HƯỚNG GIAO DỊCH</span>
                <span className="text-[11px] font-mono">{timeFormatted}</span>
              </div>

              <div className="flex items-center gap-3 my-2">
                <div
                  className={`p-3 rounded-xl border text-xl font-bold flex items-center gap-2 ${
                    isLong
                      ? 'bg-[#089981]/15 border-[#089981]/40 text-[#089981]'
                      : 'bg-[#F23645]/15 border-[#F23645]/40 text-[#F23645]'
                  }`}
                >
                  {isLong ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                  <span>{isLong ? 'BUY / LONG' : 'SELL / SHORT'}</span>
                </div>

                <div className="text-xs">
                  <span className="block text-[#8B949E]">Đánh giá</span>
                  <span
                    className={`inline-flex items-center gap-1 font-semibold text-xs mt-0.5 ${
                      isApproved ? 'text-[#089981]' : 'text-[#F23645]'
                    }`}
                  >
                    {isApproved ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                    {isApproved ? 'ĐÃ DUYỆT' : 'BỊ TỪ CHỐI'}
                  </span>
                </div>
              </div>

              {signal.reject_reason && (
                <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-[11px] text-red-300">
                  <b>Lý do:</b> {signal.reject_reason}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#21262D] text-xs text-[#8B949E] flex items-center justify-between">
              <span>Độ tin cậy Cosine:</span>
              <strong className="text-cyan-400 font-mono text-sm">{confidence.toFixed(1)}%</strong>
            </div>
          </div>

          {/* Col 2: Price Execution Levels (5 cols) */}
          <div className="lg:col-span-5 grid grid-cols-3 gap-2.5 p-4 bg-[#161B22]/80 border border-[#21262D] rounded-xl">
            {/* Entry */}
            <div className="p-3 bg-[#0D1117] border border-[#21262D] rounded-xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B949E] block mb-1">
                  GIÁ ENTRY
                </span>
                <strong className="text-base font-mono font-bold text-white block">
                  ${formatSignalPrice(entryPrice)}
                </strong>
              </div>
              <small className="text-[10px] text-[#8B949E] mt-2 block">
                Đóng nến M5
              </small>
            </div>

            {/* Stop Loss */}
            <div className="p-3 bg-[#0D1117] border border-[#F23645]/30 rounded-xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F23645] block mb-1">
                  STOP LOSS
                </span>
                <strong className="text-base font-mono font-bold text-white block">
                  ${formatSignalPrice(stopLoss)}
                </strong>
              </div>
              <small className="text-[10px] text-[#F23645] mt-2 block font-mono">
                -Δ${deltaSl.toFixed(1)} USD
              </small>
            </div>

            {/* Take Profit */}
            <div className="p-3 bg-[#0D1117] border border-[#089981]/30 rounded-xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#089981] block mb-1">
                  TAKE PROFIT
                </span>
                <strong className="text-base font-mono font-bold text-white block">
                  ${formatSignalPrice(takeProfit)}
                </strong>
              </div>
              <small className="text-[10px] text-[#089981] mt-2 block font-mono">
                +Δ${deltaTp.toFixed(1)} USD
              </small>
            </div>

            {/* R:R Ratio Ribbon */}
            <div className="col-span-3 mt-1 pt-2.5 border-t border-[#21262D] flex items-center justify-between text-xs">
              <span className="text-[#8B949E]">Tỷ lệ Reward / Risk:</span>
              <span className="font-mono font-bold text-white bg-blue-500/20 px-2 py-0.5 rounded text-xs border border-blue-500/30">
                R:R {formatRrRatio(rrRatio)} (Đạt chuẩn $\ge$ 1.5)
              </span>
            </div>
          </div>

          {/* Col 3: Memory Consensus & Sizing (3 cols) */}
          <div className="lg:col-span-3 p-4 bg-[#161B22]/80 border border-[#21262D] rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold mb-2">
                <Brain size={14} /> FAISS MEMORY MATCH
              </div>
              <p className="text-[11px] text-[#C9D1D9] leading-relaxed">
                Đã so khớp <b>{matchedCount} mẫu hình</b> tương đồng $\ge 85\%$ trong Memory Bank (1,977 mẫu lịch sử).
              </p>

              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-[#8B949E]">Đồng thuận:</span>
                  <span className="text-cyan-400 font-bold">{confidence.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-[#0D1117] h-2 rounded-full overflow-hidden border border-[#21262D]">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                    style={{ width: `${Math.min(confidence, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#21262D] text-[11px] text-[#8B949E] flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-400 shrink-0" />
              <span>Phân bổ 1.0% vốn: ~{(100 / (deltaSl + 1e-6)).toFixed(3)} BTC</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
