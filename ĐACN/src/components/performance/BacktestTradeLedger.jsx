import { useState, useMemo } from 'react'
import {
  Search,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  ListFilter
} from 'lucide-react'
import { formatSignalPrice } from '../../data/signalUtils.js'

export function BacktestTradeLedger({ trades = [] }) {
  const [filterType, setFilterType] = useState('ALL') // 'ALL' | 'WIN' | 'LOSS'
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15

  // Lọc dữ liệu
  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      const isWin = (trade.net_profit || 0) > 0
      const matchesFilter =
        filterType === 'ALL' ||
        (filterType === 'WIN' && isWin) ||
        (filterType === 'LOSS' && !isWin)

      const q = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !q ||
        `${trade.trade_id || ''} ${trade.entry_time || ''} ${trade.direction || ''} ${trade.exit_reason || ''}`
          .toLowerCase()
          .includes(q)

      return matchesFilter && matchesSearch
    })
  }, [trades, filterType, searchQuery])

  // Phân trang
  const totalPages = Math.ceil(filteredTrades.length / pageSize) || 1
  const paginatedTrades = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredTrades.slice(start, start + pageSize)
  }, [filteredTrades, currentPage, pageSize])

  const winCount = trades.filter((t) => (t.net_profit || 0) > 0).length
  const lossCount = trades.filter((t) => (t.net_profit || 0) <= 0).length

  return (
    <article className="panel p-5 bg-[#0D1117] border border-[#21262D] rounded-2xl shadow-xl">
      {/* Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#21262D]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight uppercase flex items-center gap-2">
              <ListFilter size={18} className="text-blue-400" />
              NHẬT KÝ CHI TIẾT CÁC LỆNH KIỂM THỬ (BACKTEST TRADE LEDGER)
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold bg-[#161B22] text-[#8B949E] border border-[#30363D]">
              {trades.length} LỆNH
            </span>
          </div>
          <p className="text-xs text-[#8B949E] mt-0.5">
            Chi tiết từng lệnh giao dịch Out-of-Sample từ file reports/backtest_trades.csv
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#161B22] p-1 border border-[#30363D] rounded-xl text-xs font-semibold">
            <button
              onClick={() => {
                setFilterType('ALL')
                setCurrentPage(1)
              }}
              className={`px-3 py-1 rounded-lg transition-colors ${
                filterType === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'text-[#8B949E] hover:text-white'
              }`}
            >
              Tất cả ({trades.length})
            </button>
            <button
              onClick={() => {
                setFilterType('WIN')
                setCurrentPage(1)
              }}
              className={`px-3 py-1 rounded-lg transition-colors ${
                filterType === 'WIN'
                  ? 'bg-emerald-600 text-white'
                  : 'text-[#8B949E] hover:text-white'
              }`}
            >
              Lệnh Thắng ({winCount})
            </button>
            <button
              onClick={() => {
                setFilterType('LOSS')
                setCurrentPage(1)
              }}
              className={`px-3 py-1 rounded-lg transition-colors ${
                filterType === 'LOSS'
                  ? 'bg-rose-600 text-white'
                  : 'text-[#8B949E] hover:text-white'
              }`}
            >
              Lệnh Thua ({lossCount})
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8B949E]" />
            <input
              type="text"
              placeholder="Tìm kiếm lệnh..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-8 pr-3 py-1.5 bg-[#161B22] border border-[#30363D] rounded-xl text-xs text-white placeholder-[#8B949E] focus:outline-none focus:border-blue-500 w-44"
            />
          </div>
        </div>
      </div>

      {/* Trades Table */}
      <div className="overflow-x-auto my-3">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#161B22] text-[#8B949E] border-b border-[#21262D]">
            <tr>
              <th className="p-3"># LỆNH</th>
              <th className="p-3">THỜI GIAN VÀO</th>
              <th className="p-3">HƯỚNG LỆNH</th>
              <th className="p-3">GIÁ ENTRY</th>
              <th className="p-3">GIÁ EXIT</th>
              <th className="p-3">SL / TP</th>
              <th className="p-3">LÃI / LỖ RÒNG</th>
              <th className="p-3">LÝ DO THOÁT</th>
              <th className="p-3">NẾN GIỮ</th>
              <th className="p-3 text-right">SỐ DƯ SAU LỆNH</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#21262D]">
            {paginatedTrades.map((t, idx) => {
              const isLong = t.direction === 'LONG' || t.direction === 'BUY'
              const isProfit = (t.net_profit || 0) >= 0
              const isTp = t.exit_reason === 'TAKE_PROFIT'
              const isSl = t.exit_reason === 'STOP_LOSS'

              return (
                <tr key={t.trade_id || idx} className="hover:bg-[#161B22]/60 transition-colors">
                  <td className="p-3 font-bold text-white">#{t.trade_id || idx + 1}</td>
                  <td className="p-3 text-[#8B949E]">{t.entry_time || '-'}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                        isLong
                          ? 'bg-[#089981]/15 text-[#089981] border border-[#089981]/30'
                          : 'bg-[#F23645]/15 text-[#F23645] border border-[#F23645]/30'
                      }`}
                    >
                      {isLong ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {isLong ? 'LONG' : 'SHORT'}
                    </span>
                  </td>
                  <td className="p-3 text-white font-semibold">
                    ${formatSignalPrice(t.entry_price || 0)}
                  </td>
                  <td className="p-3 text-white font-semibold">
                    ${formatSignalPrice(t.exit_price || 0)}
                  </td>
                  <td className="p-3 text-[11px] text-[#8B949E]">
                    <span className="text-[#F23645]">${formatSignalPrice(t.sl_price || 0)}</span> /{' '}
                    <span className="text-[#089981]">${formatSignalPrice(t.tp_price || 0)}</span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`font-bold ${
                        isProfit ? 'text-[#089981]' : 'text-[#F23645]'
                      }`}
                    >
                      {isProfit ? '+' : ''}${formatSignalPrice(t.net_profit || 0)}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isTp
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : isSl
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      }`}
                    >
                      {isTp ? (
                        <CheckCircle2 size={10} />
                      ) : isSl ? (
                        <XCircle size={10} />
                      ) : (
                        <Clock size={10} />
                      )}
                      {t.exit_reason || 'TIMEOUT'}
                    </span>
                  </td>
                  <td className="p-3 text-[#8B949E] text-[11px]">
                    {t.holding_bars || 1} nến ({(t.holding_bars || 1) * 5}m)
                  </td>
                  <td className="p-3 text-right font-bold text-white">
                    ${formatSignalPrice(t.balance_after || 10000)}
                  </td>
                </tr>
              )
            })}
            {paginatedTrades.length === 0 && (
              <tr>
                <td colSpan="10" className="p-8 text-center text-[#8B949E]">
                  Không có lệnh giao dịch nào khớp với bộ lọc.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#21262D] text-xs text-[#8B949E]">
        <span>
          Hiển thị {(currentPage - 1) * pageSize + 1} -{' '}
          {Math.min(currentPage * pageSize, filteredTrades.length)} trên{' '}
          <b>{filteredTrades.length}</b> lệnh
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-1.5 px-2 bg-[#161B22] hover:bg-[#21262D] disabled:opacity-30 disabled:hover:bg-[#161B22] text-white rounded-lg border border-[#30363D] transition-colors flex items-center gap-1"
          >
            <ChevronLeft size={14} /> Trước
          </button>
          <span className="px-3 font-semibold text-white">
            Trang {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-1.5 px-2 bg-[#161B22] hover:bg-[#21262D] disabled:opacity-30 disabled:hover:bg-[#161B22] text-white rounded-lg border border-[#30363D] transition-colors flex items-center gap-1"
          >
            Sau <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </article>
  )
}
