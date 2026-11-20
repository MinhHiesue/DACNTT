import {
  Sparkles,
  Brain,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Filter,
  BarChart2,
  Radio
} from 'lucide-react'
import { formatSignalPrice, formatConfidence, formatRrRatio } from '../../data/signalUtils.js'
import { useTradeManager } from '../../context/TradeSetupContext.jsx'

export function ActiveSignalHero({
  activeSymbol = 'BTCUSDT',
  onSelectSymbol,
  onOpenInspector
}) {
  const {
    setups,
    approveSetup,
    rejectSetup,
    radarState
  } = useTradeManager()

  const setup = setups[activeSymbol] || null
  const isBtc = activeSymbol === 'BTCUSDT'
  const isGold = activeSymbol === 'XAUUSDT'

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0D1117] via-[#161B22] to-[#0D1117] border border-[#30363D] rounded-2xl p-6 mb-6 shadow-xl">
      {/* 1. THANH CHỌN MÃ + TRẠNG THÁI RADAR TỰ ĐỘNG */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#21262D]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold tracking-wider text-[#8B949E] uppercase mr-2">
            CHỌN MÃ (TỐI ĐA 2 SETUP):
          </span>
          <button
            onClick={() => onSelectSymbol('BTCUSDT')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
              isBtc
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-lg shadow-amber-500/10'
                : 'bg-[#161B22] text-[#8B949E] border-[#30363D] hover:text-white'
            }`}
          >
            <span>BITCOIN (BTC/USDT)</span>
            {setups.BTCUSDT && (
              <span className={`w-2 h-2 rounded-full ${setups.BTCUSDT.status === 'FOLLOWING' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
            )}
          </button>

          <button
            onClick={() => onSelectSymbol('XAUUSDT')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
              isGold
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 shadow-lg shadow-yellow-500/10'
                : 'bg-[#161B22] text-[#8B949E] border-[#30363D] hover:text-white'
            }`}
          >
            <span>VÀNG (XAU/USDT)</span>
            {setups.XAUUSDT && (
              <span className={`w-2 h-2 rounded-full ${setups.XAUUSDT.status === 'FOLLOWING' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
            )}
          </button>
        </div>

        {/* Trạng thái Radar tự động (thay thế nút Quét) */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
          <div className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </div>
          <Radio size={12} className="text-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">
            RADAR ĐANG QUÉT TỰ ĐỘNG
          </span>
          <span className="text-[10px] font-mono text-[#8B949E]">
            #{radarState.scanCount} · {radarState.lastSymbolScanned}
          </span>
        </div>
      </div>

      {/* 2. KHI CHƯA CÓ SETUP: HIỂN THỊ TRẠNG THÁI CHỜ TỰ ĐỘNG */}
      {!setup ? (
        <div className="py-8">
          <div className="text-center flex flex-col items-center justify-center mb-6">
            <div className="relative mb-4">
              <Brain size={44} className="text-[#30363D]" />
              {/* Vòng sóng radar xung quanh */}
              <span className="absolute -inset-3 rounded-full border border-emerald-500/20 animate-ping" />
            </div>
            <h3 className="text-base font-bold text-white">Radar đang quét thị trường 24/7</h3>
            <p className="text-xs text-[#8B949E] mt-1 max-w-lg leading-relaxed">
              Hệ thống tự động theo dõi nến Binance M5 liên tục. Khi phát hiện mẫu hình vượt qua{' '}
              <b>4 cổng kiểm duyệt nghiêm ngặt</b>, setup sẽ tự động xuất hiện tại đây để bạn phê duyệt.{' '}
              <b>Không cần bấm nút — hệ thống luôn hoạt động.</b>
            </p>
          </div>

          {/* BẢNG CHẨN ĐOÁN 4 CỔNG KIỂM DUYỆT CỦA AI */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-[#0D1117] border border-[#21262D] rounded-xl">
            <div className="p-3 bg-[#161B22] rounded-lg border border-[#21262D]">
              <span className="text-[10px] text-[#8B949E] uppercase font-bold block mb-1 flex items-center gap-1">
                <BarChart2 size={12} className="text-blue-400" /> 1. VOLUME REGIME
              </span>
              <strong className="text-xs text-white block">Phân vị P20 - P85</strong>
              <small className="text-[10px] text-emerald-400 mt-1 block">Lọc bỏ bão tin &amp; thanh khoản mỏng</small>
            </div>

            <div className="p-3 bg-[#161B22] rounded-lg border border-[#21262D]">
              <span className="text-[10px] text-[#8B949E] uppercase font-bold block mb-1 flex items-center gap-1">
                <Layers size={12} className="text-cyan-400" /> 2. FAISS COSINE
              </span>
              <strong className="text-xs text-white block">Tương đồng &ge; 85%</strong>
              <small className="text-[10px] text-[#8B949E] mt-1 block">So khớp 1.230 mẫu hình thắng</small>
            </div>

            <div className="p-3 bg-[#161B22] rounded-lg border border-[#21262D]">
              <span className="text-[10px] text-[#8B949E] uppercase font-bold block mb-1 flex items-center gap-1">
                <Filter size={12} className="text-purple-400" /> 3. ĐỒNG THUẬN HƯỚNG
              </span>
              <strong className="text-xs text-white block">Tỷ lệ &ge; 80% (k &ge; 10)</strong>
              <small className="text-[10px] text-[#8B949E] mt-1 block">Ít nhất 8/10 mẫu cùng hướng</small>
            </div>

            <div className="p-3 bg-[#161B22] rounded-lg border border-[#21262D]">
              <span className="text-[10px] text-[#8B949E] uppercase font-bold block mb-1 flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-400" /> 4. QUẢN TRỊ RỦI RO
              </span>
              <strong className="text-xs text-white block">Tỷ lệ R:R &ge; 1.5</strong>
              <small className="text-[10px] text-[#8B949E] mt-1 block">Swing Low/High bảo vệ chặt</small>
            </div>
          </div>
        </div>
      ) : (
        /* 3. KHI CÓ MẪU HÌNH ĐẠT CHUẨN: HIỂN THỊ SETUP ĐỂ BẠN PHÊ DUYỆT */
        <div className="mt-5">
          {/* Banner Trạng thái & Quyết định Người dùng */}
          <div className={`p-4 rounded-xl border mb-5 flex flex-wrap items-center justify-between gap-4 ${
            setup.status === 'FOLLOWING'
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-amber-500/10 border-amber-500/30'
          }`}>
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  setup.status === 'FOLLOWING' ? 'bg-emerald-400' : 'bg-amber-400'
                }`} />
                <span className={`relative inline-flex rounded-full h-3 w-3 ${
                  setup.status === 'FOLLOWING' ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
              </span>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <span className={setup.status === 'FOLLOWING' ? 'text-emerald-400' : 'text-amber-400'}>
                    {setup.status === 'FOLLOWING' ? '● ĐANG LIVE THEO DÕI TRÊN BIỂU ĐỒ' : '⌛ MẪU HÌNH ĐẠT CHUẨN: CHỜ BẠN DUYỆT'}
                  </span>
                  <span className="text-[11px] text-[#8B949E]">
                    (Khởi tạo {Math.max(1, Math.round((Date.now() - setup.createdAt) / 60000))} phút trước)
                  </span>
                </div>
                <p className="text-xs text-[#C9D1D9] mt-0.5">
                  {setup.status === 'FOLLOWING'
                    ? 'Bạn đã phê duyệt. Biểu đồ chỉ hiển thị duy nhất lệnh này với các mốc Entry, SL, TP rõ ràng.'
                    : 'Mẫu hình đã vượt qua 4 cổng kiểm duyệt. Bấm "ĐỒNG Ý" để đưa lệnh lên live chart và bắt đầu theo dõi tự động.'}
                </p>
              </div>
            </div>

            {/* Các nút bấm Duyệt / Từ chối */}
            <div className="flex items-center gap-2.5">
              {setup.status === 'PENDING_APPROVAL' ? (
                <>
                  <button
                    onClick={() => approveSetup(activeSymbol)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    <CheckCircle2 size={15} />
                    ĐỒNG Ý FOLLOW SETUP NÀY
                  </button>
                  <button
                    onClick={() => rejectSetup(activeSymbol, 'Người dùng từ chối')}
                    className="px-3.5 py-2 bg-[#21262D] hover:bg-red-500/20 text-[#8B949E] hover:text-red-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-[#30363D] hover:border-red-500/40 transition-all cursor-pointer"
                  >
                    <XCircle size={14} />
                    Từ chối
                  </button>
                </>
              ) : (
                <>
                  {setup && onOpenInspector && (
                    <button
                      onClick={() => onOpenInspector(setup)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md hover:shadow-cyan-500/20 cursor-pointer"
                    >
                      <Sparkles size={13} />
                      Soi chiếu mẫu hình
                    </button>
                  )}
                  <button
                    onClick={() => rejectSetup(activeSymbol, 'Hủy theo dõi thủ công')}
                    className="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <XCircle size={14} />
                    Hủy vị thế live
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Chi tiết thông số vào lệnh */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Cột 1: Hướng & Thông điệp (4 cột) */}
            <div className="lg:col-span-4 p-4 bg-[#161B22]/80 border border-[#21262D] rounded-xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8B949E] tracking-wider block mb-2">
                  LỆNH DUY NHẤT TRÊN {setup.pair}
                </span>

                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl border text-xl font-bold flex items-center gap-2 ${
                    setup.direction === 'BUY'
                      ? 'bg-[#089981]/15 border-[#089981]/40 text-[#089981]'
                      : 'bg-[#F23645]/15 border-[#F23645]/40 text-[#F23645]'
                  }`}>
                    {setup.direction === 'BUY' ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                    <span>{setup.direction} / {setup.type}</span>
                  </div>

                  <div className="text-xs">
                    <span className="text-[#8B949E] block">Độ tin cậy AI</span>
                    <strong className="text-cyan-400 font-mono text-sm">{setup.confidence}%</strong>
                  </div>
                </div>

                <p className="text-xs text-[#8B949E] mt-3 leading-relaxed">
                  {setup.analysis}
                </p>
              </div>

              {/* Invalidation Rules Alert */}
              <div className="mt-4 p-2.5 bg-[#0D1117] border border-[#30363D] rounded-lg text-[11px] text-[#8B949E]">
                <div className="font-semibold text-amber-400 flex items-center gap-1 mb-1">
                  <Clock size={12} /> QUY TẮC TỰ ĐỘNG HỦY SETUP:
                </div>
                • Nếu giá đi qua vùng vào lệnh trước khi khớp ➔ <b>Tự hủy (Missed Entry)</b>.<br/>
                • Nếu giá đi ngang quá 15 phút không kích hoạt ➔ <b>Tự hủy (Sideway Timeout)</b>.
              </div>
            </div>

            {/* Cột 2: Ba mốc giá Entry - SL - TP (5 cột) */}
            <div className="lg:col-span-5 grid grid-cols-3 gap-2.5 p-4 bg-[#161B22]/80 border border-[#21262D] rounded-xl">
              {/* Entry */}
              <div className="p-3 bg-[#0D1117] border border-blue-500/40 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block mb-1">
                    ENTRY (VÀO)
                  </span>
                  <strong className="text-base font-mono font-bold text-white block">
                    ${formatSignalPrice(setup.entry_price)}
                  </strong>
                </div>
                <small className="text-[10px] text-[#8B949E] mt-2 block">
                  Giá nến thật
                </small>
              </div>

              {/* Stop Loss */}
              <div className="p-3 bg-[#0D1117] border border-red-500/40 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 block mb-1">
                    STOP LOSS (CẮT)
                  </span>
                  <strong className="text-base font-mono font-bold text-white block">
                    ${formatSignalPrice(setup.stop_loss)}
                  </strong>
                </div>
                <small className="text-[10px] text-red-400 mt-2 block font-mono">
                  -Δ${(setup.delta_sl || Math.abs(setup.entry_price - setup.stop_loss)).toFixed(1)}
                </small>
              </div>

              {/* Take Profit */}
              <div className="p-3 bg-[#0D1117] border border-emerald-500/40 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                    TAKE PROFIT (LỜI)
                  </span>
                  <strong className="text-base font-mono font-bold text-white block">
                    ${formatSignalPrice(setup.take_profit)}
                  </strong>
                </div>
                <small className="text-[10px] text-emerald-400 mt-2 block font-mono">
                  +Δ${(setup.delta_tp || Math.abs(setup.take_profit - setup.entry_price)).toFixed(1)}
                </small>
              </div>

              {/* R:R Ratio Ribbon */}
              <div className="col-span-3 mt-1 pt-2.5 border-t border-[#21262D] flex items-center justify-between text-xs">
                <span className="text-[#8B949E]">Tỷ lệ Lợi nhuận / Rủi ro:</span>
                <span className="font-mono font-bold text-white bg-blue-500/20 px-2.5 py-0.5 rounded text-xs border border-blue-500/30">
                  R:R 1:{formatRrRatio(setup.rr_ratio || 1.8)} (Đạt chuẩn)
                </span>
              </div>
            </div>

            {/* Cột 3: Kỷ luật giao dịch (3 cột) */}
            <div className="lg:col-span-3 p-4 bg-[#161B22]/80 border border-[#21262D] rounded-xl flex flex-col justify-between">
              <div>
                <div className="text-xs text-blue-400 font-semibold mb-2 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  KỶ LUẬT GIAO DỊCH
                </div>
                <p className="text-[11px] text-[#C9D1D9] leading-relaxed">
                  Setup này đã thỏa mãn đầy đủ các điều kiện khắt khe của mô hình. Hãy kiên định theo kế hoạch TP/SL đã định sẵn.
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#21262D] text-[11px] text-[#8B949E]">
                <span>Trạng thái: </span>
                <strong className={setup.status === 'FOLLOWING' ? 'text-emerald-400' : 'text-amber-400'}>
                  {setup.status === 'FOLLOWING' ? 'Đã duyệt & đang live' : 'Chờ bạn ấn duyệt'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
