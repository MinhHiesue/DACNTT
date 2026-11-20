import { Radio, ShieldCheck, Clock, CheckCircle2, AlertTriangle, Sparkles, X } from 'lucide-react'
import { useTradeManager } from '../../context/TradeSetupContext.jsx'
import { formatSignalPrice } from '../../data/signalUtils.js'

export function ContinuousRadarHud({ onNavigate }) {
  const { radarState, dismissRadarAlert, setups } = useTradeManager()

  return (
    <div className="mb-5 space-y-2">
      {/* 1. THANH RADAR QUÉT NỀN LIÊN TỤC */}
      <section className="relative overflow-hidden p-3.5 bg-gradient-to-r from-[#0D1117] via-[#161B22] to-[#0D1117] border border-[#21262D] rounded-2xl shadow-lg">
        {/* Glow radar */}
        <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          {/* Trạng thái Radar */}
          <div className="flex items-center gap-3">
            <div className="flex h-3.5 w-3.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
                  <Radio size={14} className="text-emerald-400 animate-pulse" />
                  RADAR AI ĐANG QUÉT LIÊN TỤC 24/7
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                  TẦN SUẤT 5S/LẦN
                </span>
              </div>
              <p className="text-[11px] text-[#8B949E] mt-0.5">
                Tự động bắt sự kiện nến Binance đóng cửa cho <b>BTC/USDT</b> & <b>XAU/USDT</b>. Khi xuất hiện mẫu hình A+, hệ thống sẽ tự động phát chuông và đề xuất.
              </p>
            </div>
          </div>

          {/* Chỉ số theo dõi */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0D1117] border border-[#21262D] rounded-xl font-mono text-[11px]">
              <span className="text-[#8B949E]">Đã kiểm duyệt:</span>
              <strong className="text-cyan-400">{radarState.scanCount} lần</strong>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0D1117] border border-[#21262D] rounded-xl font-mono text-[11px]">
              <span className="text-[#8B949E]">Đang rà soát:</span>
              <strong className="text-amber-400">{radarState.lastSymbolScanned}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BANNER CẢNH BÁO KHI TỰ ĐỘNG PHÁT HIỆN SETUP A+ */}
      {radarState.alertBanner && (
        <section className="p-4 bg-gradient-to-r from-emerald-950/80 via-[#161B22] to-emerald-950/80 border border-emerald-500/50 rounded-2xl shadow-xl animate-bounce-short flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles size={18} className="animate-spin" />
            </div>
            <div>
              <strong className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                🔔 PHÁT HIỆN SETUP THẮNG ĐẠT CHUẨN MỚI!
              </strong>
              <p className="text-xs text-white mt-0.5">
                {radarState.alertBanner.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate && onNavigate('Tín hiệu AI')}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Xem & Phê duyệt ngay
            </button>
            <button
              onClick={dismissRadarAlert}
              className="p-1.5 text-[#8B949E] hover:text-white rounded-lg hover:bg-[#21262D] transition-colors cursor-pointer"
              title="Đóng thông báo"
            >
              <X size={15} />
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

