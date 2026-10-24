import { useMemo } from 'react'
import { Activity, AlertTriangle, CheckCircle2, Info, Zap, Flame, ShieldAlert, Sparkles } from 'lucide-react'

export function VolumeRegimeGauge({ volumeRegime, compact = false }) {
  // Dữ liệu mặc định thực chiến nếu backend đang khởi động
  const data = volumeRegime || {
    current_volume: 38.65,
    p20: 18.20,
    p85: 62.40,
    pass_filter: true,
    reason: 'NORMAL'
  }

  const { current_volume, p20, p85, pass_filter, reason } = data

  // Xác định phân vùng hiện tại
  const isThin = current_volume < p20 || reason === 'THIN_LIQUIDITY'
  const isSpike = current_volume > p85 || reason === 'NEWS_SPIKE'
  const isOptimal = pass_filter && !isThin && !isSpike

  // Tính toán vị trí con trỏ % trên thang đo 3 vùng (0-25% là P20, 25-75% là P20->P85, 75-100% là >P85)
  const pointerPercent = useMemo(() => {
    if (p20 <= 0 || p85 <= p20) return 50

    if (current_volume <= p20) {
      // Nằm trong vùng mỏng (0 -> 25%)
      const ratio = Math.max(0, current_volume / p20)
      return Math.min(25, ratio * 25)
    } else if (current_volume <= p85) {
      // Nằm trong vùng tối ưu (25% -> 75%)
      const ratio = (current_volume - p20) / (p85 - p20)
      return 25 + ratio * 50
    } else {
      // Nằm trong vùng bão tin (75% -> 100%)
      const overflowRatio = (current_volume - p85) / Math.max(p85 * 0.5, 1)
      return Math.min(98, 75 + Math.min(overflowRatio, 1) * 23)
    }
  }, [current_volume, p20, p85])

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-2 px-3 bg-[#161B22] border border-[#21262D] rounded-xl text-xs">
        <div className="flex items-center gap-1.5 font-bold">
          <Activity size={14} className="text-blue-400" />
          <span>Volume Regime:</span>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[11px] ${
            isOptimal
              ? 'bg-[#089981]/20 text-[#089981] border border-[#089981]/30'
              : isThin
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-[#F23645]/20 text-[#F23645] border border-[#F23645]/30'
          }`}
        >
          {isOptimal ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
          {isOptimal ? 'PASS (TỐI ƯU)' : isThin ? 'LỌC BỎ (MỎNG)' : 'LỌC BỎ (BÃO TIN)'}
        </span>
        <span className="font-mono text-[#8B949E]">
          {current_volume.toFixed(2)} BTC (P20: {p20.toFixed(1)} / P85: {p85.toFixed(1)})
        </span>
      </div>
    )
  }

  return (
    <article className="p-5 bg-gradient-to-br from-[#0D1117] via-[#161B22] to-[#0D1117] border border-[#30363D] rounded-2xl shadow-xl text-[#E6EDF3]">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#21262D]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
            <Activity size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-white uppercase">
                BỘ LỌC PHÂN VỊ KHỐI LƯỢNG (VOLUME REGIME FILTER)
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-[#21262D] text-cyan-300 border border-cyan-500/20">
                MODULE 1 · 100 NẾN M5
              </span>
            </div>
            <p className="text-xs text-[#8B949E]">
              Kiểm định điều kiện thanh khoản trước khi kích hoạt thuật toán so khớp FAISS
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold text-xs shadow-sm ${
              isOptimal
                ? 'bg-[#089981]/15 text-[#089981] border border-[#089981]/40'
                : isThin
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                  : 'bg-[#F23645]/15 text-[#F23645] border border-[#F23645]/40'
            }`}
          >
            {isOptimal ? <CheckCircle2 size={14} /> : <ShieldAlert size={14} />}
            {isOptimal
              ? 'ĐẠT CHUẨN (PASS) · SẴN SÀNG QUÉT MẪU HÌNH'
              : isThin
                ? 'BỎ QUA (FILTERED) · THANH KHOẢN MỎNG'
                : 'BỎ QUA (FILTERED) · BÃO BIẾN ĐỘNG (NEWS SPIKE)'}
          </span>
        </div>
      </div>

      {/* Main Gauge Visual Track */}
      <div className="my-5">
        {/* Zone Labels above the track */}
        <div className="grid grid-cols-12 text-[11px] font-semibold mb-2 text-[#8B949E]">
          <div className="col-span-3 text-amber-400 flex items-center gap-1">
            <Zap size={12} /> Vùng mỏng (&lt; P20)
          </div>
          <div className="col-span-6 text-center text-[#089981] flex items-center justify-center gap-1">
            <Sparkles size={12} /> VÙNG GIAO DỊCH LÝ TƯỞNG (P20 - P85)
          </div>
          <div className="col-span-3 text-right text-[#F23645] flex items-center justify-end gap-1">
            <Flame size={12} /> Bão tin (&gt; P85)
          </div>
        </div>

        {/* 3-Zone Linear Track */}
        <div className="relative w-full h-4 bg-[#0D1117] rounded-full overflow-visible border border-[#30363D] flex items-center">
          {/* Segment 1: Thin (0 - 25%) */}
          <div
            className="h-full rounded-l-full bg-gradient-to-r from-amber-600/40 to-amber-500/60 border-r border-[#0D1117]"
            style={{ width: '25%' }}
            title="Thanh khoản mỏng (< P20)"
          />

          {/* Segment 2: Optimal (25% - 75%) */}
          <div
            className="h-full bg-gradient-to-r from-[#089981]/50 via-[#089981]/80 to-[#089981]/50 border-r border-[#0D1117]"
            style={{ width: '50%' }}
            title="Vùng thanh khoản lý tưởng (P20 - P85)"
          />

          {/* Segment 3: Spike (75% - 100%) */}
          <div
            className="h-full rounded-r-full bg-gradient-to-r from-[#F23645]/60 to-[#F23645]/40"
            style={{ width: '25%' }}
            title="Bão biến động (> P85)"
          />

          {/* Threshold Tick Marks */}
          <div className="absolute left-[25%] top-0 bottom-0 w-[2px] bg-white/40 pointer-events-none" />
          <div className="absolute left-[75%] top-0 bottom-0 w-[2px] bg-white/40 pointer-events-none" />

          {/* Current Volume Pointer Indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-500 z-20 flex flex-col items-center pointer-events-none"
            style={{ left: `${pointerPercent}%` }}
          >
            {/* Pointer Pin Head */}
            <div
              className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${
                isOptimal ? 'bg-[#089981]' : isThin ? 'bg-amber-500' : 'bg-[#F23645]'
              }`}
            />
          </div>
        </div>

        {/* Scale labels below the track */}
        <div className="relative w-full flex justify-between text-[11px] font-mono text-[#8B949E] mt-2">
          <span>0 BTC</span>
          <span className="absolute left-[25%] -translate-x-1/2 text-white font-semibold">
            P20: {p20.toFixed(1)} BTC
          </span>
          <span className="absolute left-[75%] -translate-x-1/2 text-white font-semibold">
            P85: {p85.toFixed(1)} BTC
          </span>
          <span>&gt; {p85.toFixed(0)} BTC</span>
        </div>
      </div>

      {/* Bottom KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-[#21262D]">
        <div className="p-2.5 bg-[#161B22] border border-[#21262D] rounded-xl">
          <span className="text-[10px] text-[#8B949E] block mb-0.5">VOLUME NẾN M5 HIỆN TẠI</span>
          <strong className="text-sm font-mono font-bold text-white">
            {current_volume.toFixed(2)} BTC
          </strong>
        </div>

        <div className="p-2.5 bg-[#161B22] border border-[#21262D] rounded-xl">
          <span className="text-[10px] text-[#8B949E] block mb-0.5">NGƯỠNG DƯỚI (P20)</span>
          <strong className="text-sm font-mono font-semibold text-amber-400">
            {p20.toFixed(2)} BTC
          </strong>
        </div>

        <div className="p-2.5 bg-[#161B22] border border-[#21262D] rounded-xl">
          <span className="text-[10px] text-[#8B949E] block mb-0.5">NGƯỠNG TRÊN (P85)</span>
          <strong className="text-sm font-mono font-semibold text-[#F23645]">
            {p85.toFixed(2)} BTC
          </strong>
        </div>

        <div className="p-2.5 bg-[#161B22] border border-[#21262D] rounded-xl">
          <span className="text-[10px] text-[#8B949E] block mb-0.5">ĐIỀU KIỆN QUÉT MẪU</span>
          <strong
            className={`text-sm font-semibold flex items-center gap-1 ${
              isOptimal ? 'text-[#089981]' : 'text-amber-400'
            }`}
          >
            {isOptimal ? 'ĐỦ ĐIỀU KIỆN' : 'TẠM DỪNG QUÉT'}
          </strong>
        </div>
      </div>

      {/* Explanatory Footnote */}
      <div className="mt-3 text-[11px] text-[#8B949E] flex items-center gap-1.5">
        <Info size={12} className="text-blue-400 shrink-0" />
        <span>
          <b>Cơ chế lọc:</b> Loại bỏ 20% nến thanh khoản thấp nhất để tránh trượt giá và 15% nến biến động cực đại để tránh bão tin tức. Chỉ kích hoạt FAISS khi volume nằm giữa $P_{20}$ và $P_{85}$.
        </span>
      </div>
    </article>
  )
}
