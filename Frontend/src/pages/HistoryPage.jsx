import { useState, useMemo } from 'react'
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  XCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  BarChart2,
  Calendar,
  RotateCcw,
  Trash2,
  Radio
} from 'lucide-react'
import { PageHeading } from '../components/PageHeading.jsx'
import { useTradeManager } from '../context/TradeSetupContext.jsx'
import { formatSignalPrice, formatSignalDate } from '../data/signalUtils.js'

export function HistoryPage({ query = '' }) {
  const { tradeHistory, stats, resetAllData } = useTradeManager()
  const [filterResult, setFilterResult] = useState('ALL') // ALL | WIN | LOSS | CANCELLED
  const [filterSymbol, setFilterSymbol] = useState('ALL') // ALL | BTCUSDT | XAUUSDT
  const [selectedId, setSelectedId] = useState(tradeHistory[0]?.id || null)
  const [confirmReset, setConfirmReset] = useState(false)

  const normalizedQuery = (query || '').trim().toLowerCase()

  const filteredTrades = useMemo(() => {
    return tradeHistory.filter((t) => {
      const matchResult = filterResult === 'ALL' || t.result === filterResult
      const matchSymbol = filterSymbol === 'ALL' || t.symbol === filterSymbol
      const matchQuery =
        !normalizedQuery ||
        `${t.symbol} ${t.pair} ${t.direction} ${t.result} ${t.exitReason || ''}`
          .toLowerCase()
          .includes(normalizedQuery)

      return matchResult && matchSymbol && matchQuery
    })
  }, [tradeHistory, filterResult, filterSymbol, normalizedQuery])

  const selectedTrade = useMemo(() => {
    return tradeHistory.find((t) => t.id === selectedId) || filteredTrades[0] || null
  }, [tradeHistory, selectedId, filteredTrades])

  const handleReset = () => {
    resetAllData()
    setConfirmReset(false)
    setSelectedId(null)
  }

  return (
    <div className="utility-page">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <PageHeading
          eyebrow="TRADE PERFORMANCE ARCHIVE"
          title="Lịch sử lệnh & Tỷ lệ thắng (Win Rate)"
          subtitle="Theo dõi hiệu quả thực tế các setup bạn đã duyệt follow: Đạt TP, Chạm SL, hay Tự hủy (Missed Entry / Đi ngang)."
          badge={`${tradeHistory.length} BẢN GHI`}
        />

        {/* Nút Reset Dữ Liệu Sạch Sẽ */}
        <div>
          {confirmReset ? (
            <div className="flex items-center gap-2 p-1.5 bg-red-500/15 border border-red-500/30 rounded-xl">
              <span className="text-xs text-red-300 font-medium px-2">Xác nhận xóa sạch lịch sử?</span>
              <button
                onClick={handleReset}
                className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
              >
                Đồng ý xóa
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="px-2.5 py-1 bg-[#21262D] text-[#8B949E] hover:text-white rounded-lg text-xs cursor-pointer transition-colors"
              >
                Hủy
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="px-3.5 py-2 bg-[#161B22] hover:bg-red-500/10 text-[#8B949E] hover:text-red-400 border border-[#21262D] hover:border-red-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Xóa toàn bộ lịch sử lệnh để bắt đầu lại sạch sẽ"
            >
              <Trash2 size={13} />
              <span>Reset toàn bộ dữ liệu</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. KHỐI THỐNG KÊ HIỆU SUẤT TRỰC QUAN (CHUẨN BOT TÍN HIỆU) */}
      {/* ============================================================== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
        {/* Card 1: Win Rate % */}
        <div className="p-4 bg-gradient-to-br from-[#0D1117] to-[#161B22] border border-emerald-500/30 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between text-xs text-[#8B949E] mb-1">
            <span className="font-bold tracking-wider uppercase text-emerald-400">WIN RATE THỰC TẾ</span>
            <Trophy size={16} className="text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-mono font-black text-white">
              {stats.winRate}%
            </span>
            <span className="text-xs text-emerald-400 font-semibold">
              ({stats.winTrades}/{stats.totalTrades} lệnh)
            </span>
          </div>
          <div className="w-full bg-[#21262D] h-2 rounded-full overflow-hidden mt-2.5">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(stats.winRate, 100)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Tổng số lệnh hoàn tất */}
        <div className="p-4 bg-[#0D1117] border border-[#21262D] rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#8B949E]">
            <span className="font-bold uppercase tracking-wider">LỆNH ĐÃ CHỐT</span>
            <CheckCircle2 size={16} className="text-blue-400" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-mono font-bold text-white">
              {stats.totalTrades}
            </span>
            <span className="text-xs text-[#8B949E] ml-1.5">vị thế hoàn tất</span>
          </div>
          <div className="text-[11px] text-[#8B949E] flex items-center justify-between">
            <span className="text-emerald-400 font-semibold">Đạt TP: {stats.winTrades}</span>
            <span className="text-red-400 font-semibold">Chạm SL: {stats.lossTrades}</span>
          </div>
        </div>

        {/* Card 3: Lệnh bị tự hủy (Invalidated) */}
        <div className="p-4 bg-[#0D1117] border border-[#21262D] rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#8B949E]">
            <span className="font-bold uppercase tracking-wider">TỰ ĐỘNG HỦY</span>
            <Clock size={16} className="text-amber-400" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-mono font-bold text-amber-400">
              {stats.cancelledTrades}
            </span>
            <span className="text-xs text-[#8B949E] ml-1.5">lệnh bảo vệ</span>
          </div>
          <p className="text-[10px] text-[#8B949E] leading-tight">
            Missed Entry hoặc đi ngang &gt; 15p
          </p>
        </div>

        {/* Card 4: Tổng R:R Tích lũy (Chuẩn Quản Trị Rủi Ro) */}
        <div className="p-4 bg-[#0D1117] border border-[#21262D] rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#8B949E]">
            <span className="font-bold uppercase tracking-wider">TỔNG R:R TÍCH LŨY</span>
            <BarChart2 size={16} className={stats.totalR >= 0 ? 'text-emerald-400' : 'text-red-400'} />
          </div>
          <div className="my-1">
            <span className={`text-2xl font-mono font-bold ${stats.totalR >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {stats.totalR >= 0 ? '+' : ''}{stats.totalR}R
            </span>
          </div>
          <span className="text-[10px] text-[#8B949E]">
            Quy chuẩn R-Multiple quốc tế
          </span>
        </div>

        {/* Card 5: Tổng điểm biến động */}
        <div className="p-4 bg-[#0D1117] border border-[#21262D] rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#8B949E]">
            <span className="font-bold uppercase tracking-wider">TỔNG ĐIỂM BIẾN ĐỘNG</span>
            <TrendingUp size={16} className={stats.netPoints >= 0 ? 'text-cyan-400' : 'text-red-400'} />
          </div>
          <div className="my-1">
            <span className={`text-2xl font-mono font-bold ${stats.netPoints >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
              {stats.netPoints >= 0 ? '+' : ''}{formatSignalPrice(stats.netPoints)} pts
            </span>
          </div>
          <span className="text-[10px] text-[#8B949E]">
            Biến động theo biên độ giá thật
          </span>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. THANH BỘ LỌC LỊCH SỬ LỆNH */}
      {/* ============================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#161B22] border border-[#21262D] rounded-xl mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#8B949E] font-semibold flex items-center gap-1 mr-1">
            <Filter size={13} /> KẾT QUẢ:
          </span>
          {['ALL', 'WIN', 'LOSS', 'CANCELLED'].map((item) => (
            <button
              key={item}
              onClick={() => setFilterResult(item)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                filterResult === item
                  ? item === 'WIN'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : item === 'LOSS'
                    ? 'bg-red-500/20 text-red-400 border-red-500/40'
                    : item === 'CANCELLED'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-blue-600 text-white border-blue-500'
                  : 'bg-[#0D1117] text-[#8B949E] border-[#30363D] hover:text-white'
              }`}
            >
              {item === 'ALL' && 'Tất cả'}
              {item === 'WIN' && 'Thắng (TP Hit)'}
              {item === 'LOSS' && 'Thua (SL Hit)'}
              {item === 'CANCELLED' && 'Tự hủy an toàn'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8B949E] font-semibold">CẶP:</span>
          {['ALL', 'BTCUSDT', 'XAUUSDT'].map((sym) => (
            <button
              key={sym}
              onClick={() => setFilterSymbol(sym)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                filterSymbol === sym
                  ? 'bg-[#30363D] text-white border-[#8B949E]'
                  : 'bg-[#0D1117] text-[#8B949E] border-[#21262D] hover:text-white'
              }`}
            >
              {sym === 'ALL' ? 'Tất cả' : sym === 'BTCUSDT' ? 'BTC' : 'XAU'}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. BẢNG DANH SÁCH LỆNH & CHI TIẾT LỆNH */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Bảng danh sách (8 cột) */}
        <section className="lg:col-span-8 panel p-0 overflow-hidden border border-[#21262D] rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161B22] text-[#8B949E] border-b border-[#21262D] uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">CẶP TIỀN</th>
                  <th className="py-3 px-3">HƯỚNG</th>
                  <th className="py-3 px-3">ENTRY</th>
                  <th className="py-3 px-3">EXIT / ĐÓNG</th>
                  <th className="py-3 px-3">KẾT QUẢ</th>
                  <th className="py-3 px-3 text-center">HIỆU QUẢ R:R</th>
                  <th className="py-3 px-3 text-right">BIẾN ĐỘNG GIÁ</th>
                  <th className="py-3 px-4 text-right">THỜI GIAN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262D]">
                {filteredTrades.map((trade) => {
                  const isWin = trade.result === 'WIN'
                  const isLoss = trade.result === 'LOSS'
                  const isCancelled = trade.result === 'CANCELLED'
                  const isBuy = trade.direction === 'BUY'
                  const isSelected = selectedId === trade.id
                  const deltaPts = Number(trade.deltaPoints) || 0
                  const deltaPct = Number(trade.deltaPct) || 0
                  const realizedR = Number(trade.realizedR) || 0

                  return (
                    <tr
                      key={trade.id}
                      onClick={() => setSelectedId(trade.id)}
                      className={`cursor-pointer transition-colors hover:bg-[#161B22]/70 ${
                        isSelected ? 'bg-blue-600/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {trade.pair || trade.symbol}
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] inline-flex items-center gap-1 ${
                          isBuy
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/15 text-red-400 border border-red-500/30'
                        }`}>
                          {isBuy ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          {trade.direction}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono text-white">
                        ${formatSignalPrice(trade.entry_price)}
                      </td>

                      <td className="py-3 px-3 font-mono text-[#8B949E]">
                        ${formatSignalPrice(trade.exit_price || trade.entry_price)}
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                          isWin
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : isLoss
                            ? 'bg-red-500/20 text-red-300 border-red-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          {isWin && '✔ THẮNG (TP HIT)'}
                          {isLoss && '✖ THUA (SL HIT)'}
                          {isCancelled && '⌛ ĐÃ HỦY AN TOÀN'}
                        </span>
                      </td>

                      {/* Hiệu quả R:R */}
                      <td className="py-3 px-3 text-center">
                        <span className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded ${
                          isWin ? 'bg-emerald-500/15 text-emerald-400' : isLoss ? 'bg-red-500/15 text-red-400' : 'text-[#8B949E]'
                        }`}>
                          {isWin ? `+${realizedR > 0 ? realizedR : 1.5}R` : isLoss ? '-1.0R' : '0.0R'}
                        </span>
                      </td>

                      {/* Biến động giá (Điểm / %) */}
                      <td className={`py-3 px-3 font-mono font-bold text-right ${
                        deltaPts > 0 ? 'text-emerald-400' : deltaPts < 0 ? 'text-red-400' : 'text-[#8B949E]'
                      }`}>
                        {deltaPts > 0 ? `+${formatSignalPrice(deltaPts)}` : deltaPts < 0 ? `-${formatSignalPrice(Math.abs(deltaPts))}` : '0.00'}
                        <span className="text-[10px] block opacity-75 font-normal">
                          {deltaPct > 0 ? `(+${deltaPct.toFixed(2)}%)` : deltaPct < 0 ? `(-${Math.abs(deltaPct).toFixed(2)}%)` : '(0.00%)'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right text-[11px] text-[#8B949E] font-mono">
                        {formatSignalDate(trade.closedAt)}
                      </td>
                    </tr>
                  )
                })}

                {filteredTrades.length === 0 && (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-[#8B949E]">
                      <Search size={22} className="mx-auto mb-2 opacity-40" />
                      <p className="font-semibold text-white">Chưa có bản ghi nào</p>
                      <small className="text-[11px] text-[#8B949E] block mt-1">
                        Dữ liệu đã được reset sạch sẽ. Khi hệ thống duyệt lệnh thật và hoàn tất, nhật ký sẽ tự động xuất hiện tại đây.
                      </small>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Panel Chi tiết Lệnh được chọn (4 cột) */}
        <aside className="lg:col-span-4 panel p-5 bg-[#0D1117] border border-[#21262D] rounded-2xl flex flex-col justify-between">
          {selectedTrade ? (
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#21262D] mb-4">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-[#8B949E] block">
                    CHI TIẾT VỊ THẾ
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    {selectedTrade.pair || selectedTrade.symbol} · {selectedTrade.direction}
                  </h3>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                  selectedTrade.result === 'WIN'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : selectedTrade.result === 'LOSS'
                    ? 'bg-red-500/20 text-red-400 border-red-500/40'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                }`}>
                  {selectedTrade.result}
                </span>
              </div>

              {/* Thông số vào / ra */}
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                <div className="p-2.5 bg-[#161B22] border border-[#21262D] rounded-xl">
                  <span className="text-[10px] text-[#8B949E] block">Giá Entry</span>
                  <strong className="text-sm font-mono text-white block mt-0.5">
                    ${formatSignalPrice(selectedTrade.entry_price)}
                  </strong>
                </div>

                <div className="p-2.5 bg-[#161B22] border border-[#21262D] rounded-xl">
                  <span className="text-[10px] text-[#8B949E] block">Giá Exit</span>
                  <strong className="text-sm font-mono text-white block mt-0.5">
                    ${formatSignalPrice(selectedTrade.exit_price || selectedTrade.entry_price)}
                  </strong>
                </div>

                <div className="p-2.5 bg-[#161B22] border border-red-500/20 rounded-xl">
                  <span className="text-[10px] text-red-400 block">Stop Loss</span>
                  <strong className="text-sm font-mono text-white block mt-0.5">
                    ${formatSignalPrice(selectedTrade.stop_loss)}
                  </strong>
                </div>

                <div className="p-2.5 bg-[#161B22] border border-emerald-500/20 rounded-xl">
                  <span className="text-[10px] text-emerald-400 block">Take Profit</span>
                  <strong className="text-sm font-mono text-white block mt-0.5">
                    ${formatSignalPrice(selectedTrade.take_profit)}
                  </strong>
                </div>
              </div>

              {/* Lý do kết thúc lệnh */}
              <div className="p-3 bg-[#161B22] border border-[#21262D] rounded-xl mb-4">
                <span className="text-[10px] text-[#8B949E] font-bold uppercase block mb-1">
                  KẾT QUẢ & LÝ DO ĐÓNG VỊ THẾ:
                </span>
                <p className="text-xs text-[#C9D1D9] font-medium leading-relaxed">
                  {selectedTrade.exitReason || 'Đã đóng theo diễn biến thị trường.'}
                </p>
              </div>

              {/* Thông tin Biến động giá & Thời gian */}
              <div className="space-y-2 text-xs text-[#8B949E] pt-2 border-t border-[#21262D]">
                <div className="flex justify-between">
                  <span>Hiệu quả R-Multiple:</span>
                  <strong className={`font-mono ${
                    selectedTrade.result === 'WIN' ? 'text-emerald-400' : selectedTrade.result === 'LOSS' ? 'text-red-400' : 'text-white'
                  }`}>
                    {selectedTrade.result === 'WIN' ? `+${selectedTrade.realizedR || 1.5}R` : selectedTrade.result === 'LOSS' ? '-1.0R' : '0.0R'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Biến động điểm giá:</span>
                  <strong className={`font-mono ${
                    selectedTrade.deltaPoints > 0 ? 'text-emerald-400' : selectedTrade.deltaPoints < 0 ? 'text-red-400' : 'text-white'
                  }`}>
                    {selectedTrade.deltaPoints > 0 ? `+${formatSignalPrice(selectedTrade.deltaPoints)} pts` : selectedTrade.deltaPoints < 0 ? `-${formatSignalPrice(Math.abs(selectedTrade.deltaPoints))} pts` : '0.00 pts'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Thời lượng theo dõi:</span>
                  <span className="text-white font-mono">{selectedTrade.durationMinutes || 15} phút</span>
                </div>
                <div className="flex justify-between">
                  <span>Thời điểm chốt:</span>
                  <span className="text-white font-mono">{formatSignalDate(selectedTrade.closedAt)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-[#8B949E]">
              <Clock size={28} className="mx-auto mb-2 opacity-30" />
              <span className="text-xs">Chưa chọn bản ghi nào</span>
            </div>
          )}

          <div className="mt-5 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[11px] text-blue-300">
            💡 <b>Nguyên lý minh bạch:</b> Bot phát tín hiệu đo lường hiệu quả dựa trên <b>R:R và Biên độ điểm giá</b>, không can thiệp vốn hay giả định số tiền USD của trader.
          </div>
        </aside>
      </div>
    </div>
  )
}
