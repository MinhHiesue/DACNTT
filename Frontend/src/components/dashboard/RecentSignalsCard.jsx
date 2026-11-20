import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  Trophy,
  MoreHorizontal
} from 'lucide-react'
import { useTradeManager } from '../../context/TradeSetupContext.jsx'
import { formatSignalPrice } from '../../data/signalUtils.js'

export function RecentSignalsCard({ onNavigate }) {
  const navigate = useNavigate()
  const { setups, stats, approveSetup, rejectSetup } = useTradeManager()

  const btcSetup = setups.BTCUSDT
  const xauSetup = setups.XAUUSDT

  const handleGoToHistory = () => {
    if (onNavigate) {
      onNavigate('Lịch sử')
    } else {
      navigate('/history')
    }
  }

  return (
    <article className="panel signal-panel">
      <div className="panel-header">
        <div>
          <div className="panel-kicker">STRICT POSITION DISCIPLINE</div>
          <div className="signal-title-row">
            <h2>Quản lý Setup Live</h2>
            <span className="live-count">
              <span className="online-pulse" /> TỐI ĐA 2 SETUP
            </span>
          </div>
        </div>
        <button
          className="icon-button more-button"
          aria-label="Mở tất cả tín hiệu AI"
          title="Mở trung tâm tín hiệu AI"
          onClick={() => onNavigate('Tín hiệu AI')}
        >
          <MoreHorizontal size={19} />
        </button>
      </div>

      <div className="p-3 bg-[#161B22]/70 border border-[#21262D] rounded-xl my-2 text-xs text-[#8B949E]">
        ⚡ <b>Quy tắc Kỷ luật:</b> Mỗi mã chỉ có duy nhất 1 setup. Phải bấm "Đồng ý" thì mới theo dõi live trên biểu đồ. (100% No Mock).
      </div>

      {/* DANH SÁCH 2 SETUP QUẢN LÝ */}
      <div className="space-y-3 my-3">
        {/* SETUP 1: BITCOIN */}
        <div className="p-3.5 bg-[#0D1117] border border-[#21262D] rounded-xl hover:border-[#30363D] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <strong className="text-white text-xs font-mono">BTC / USDT</strong>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                BITCOIN M5
              </span>
            </div>
            {btcSetup ? (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                btcSetup.status === 'FOLLOWING'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }`}>
                {btcSetup.status === 'FOLLOWING' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                {btcSetup.status === 'FOLLOWING' ? 'ĐANG THEO DÕI LIVE' : 'CHỜ BẠN DUYỆT'}
              </span>
            ) : (
              <span className="text-[10px] text-[#8B949E]">CHƯA CÓ SETUP</span>
            )}
          </div>

          {btcSetup ? (
            <div>
              <div className="flex items-center justify-between text-xs my-1">
                <span className={`font-bold inline-flex items-center gap-1 ${
                  btcSetup.direction === 'BUY' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {btcSetup.direction === 'BUY' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {btcSetup.direction} @ ${formatSignalPrice(btcSetup.entry_price)}
                </span>
                <span className="font-mono text-[#8B949E] text-[11px]">
                  TP: ${formatSignalPrice(btcSetup.take_profit)} · SL: ${formatSignalPrice(btcSetup.stop_loss)}
                </span>
              </div>

              {btcSetup.status === 'PENDING_APPROVAL' && (
                <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-[#21262D]">
                  <button
                    onClick={() => approveSetup('BTCUSDT')}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    ✔ Đồng ý Follow
                  </button>
                  <button
                    onClick={() => rejectSetup('BTCUSDT', 'Người dùng từ chối')}
                    className="px-3 py-1.5 bg-[#21262D] hover:bg-red-500/20 text-[#8B949E] hover:text-red-300 rounded-lg text-xs font-semibold border border-[#30363D] transition-colors cursor-pointer"
                  >
                    Từ chối
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between mt-1 text-[11px] text-[#8B949E]">
              <span>Radar đang rà soát nến M5 liên tục...</span>
              <span className="font-mono text-emerald-400 text-[10px] font-bold">TỰ ĐỘNG BẮT SETUP</span>
            </div>
          )}
        </div>

        {/* SETUP 2: VÀNG */}
        <div className="p-3.5 bg-[#0D1117] border border-[#21262D] rounded-xl hover:border-[#30363D] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <strong className="text-white text-xs font-mono">XAU / USDT</strong>
              <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-bold">
                VÀNG FUTURES
              </span>
            </div>
            {xauSetup ? (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                xauSetup.status === 'FOLLOWING'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }`}>
                {xauSetup.status === 'FOLLOWING' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                {xauSetup.status === 'FOLLOWING' ? 'ĐANG THEO DÕI LIVE' : 'CHỜ BẠN DUYỆT'}
              </span>
            ) : (
              <span className="text-[10px] text-[#8B949E]">CHƯA CÓ SETUP</span>
            )}
          </div>

          {xauSetup ? (
            <div>
              <div className="flex items-center justify-between text-xs my-1">
                <span className={`font-bold inline-flex items-center gap-1 ${
                  xauSetup.direction === 'BUY' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {xauSetup.direction === 'BUY' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {xauSetup.direction} @ ${formatSignalPrice(xauSetup.entry_price)}
                </span>
                <span className="font-mono text-[#8B949E] text-[11px]">
                  TP: ${formatSignalPrice(xauSetup.take_profit)} · SL: ${formatSignalPrice(xauSetup.stop_loss)}
                </span>
              </div>

              {xauSetup.status === 'PENDING_APPROVAL' && (
                <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-[#21262D]">
                  <button
                    onClick={() => approveSetup('XAUUSDT')}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    ✔ Đồng ý Follow
                  </button>
                  <button
                    onClick={() => rejectSetup('XAUUSDT', 'Người dùng từ chối')}
                    className="px-3 py-1.5 bg-[#21262D] hover:bg-red-500/20 text-[#8B949E] hover:text-red-300 rounded-lg text-xs font-semibold border border-[#30363D] transition-colors cursor-pointer"
                  >
                    Từ chối
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between mt-1 text-[11px] text-[#8B949E]">
              <span>Radar đang rà soát nến M5 liên tục...</span>
              <span className="font-mono text-amber-400 text-[10px] font-bold">TỰ ĐỘNG BẮT SETUP</span>
            </div>
          )}
        </div>
      </div>

      {/* TÓM TẮT HIỆU SUẤT GIAO DỊCH */}
      <div className="pt-3 border-t border-[#21262D] flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
          <Trophy size={14} />
          <span>
            {stats.totalTrades > 0 ? `Tỷ lệ thắng: ${stats.winRate}% (${stats.winTrades}/${stats.totalTrades})` : 'Hiệu suất: Sẵn sàng theo dõi'}
          </span>
        </div>
        <button
          onClick={handleGoToHistory}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold cursor-pointer transition-colors"
        >
          <span>Xem lịch sử giao dịch</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </article>
  )
}
