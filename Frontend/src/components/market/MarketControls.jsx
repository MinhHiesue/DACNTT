import { Gem } from 'lucide-react'
import { MARKET_TIMEFRAMES } from '../../data/market.js'

export function MarketControls({ pair, timeframe, onPairChange, onTimeframeChange }) {
  const isGold = pair === 'XAU/USDT' || pair.includes('XAU')

  return (
    <section className="analysis-toolbar flex flex-wrap items-center justify-between gap-3 p-3 bg-[#161B22] border border-[#21262D] rounded-2xl mb-5">
      {/* NÚT CHUYỂN ĐỔI 2 CẶP THẬT: VÀNG VÀ BITCOIN */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-[#8B949E] uppercase mr-1">CHỌN CHART:</span>
        <button
          type="button"
          onClick={() => onPairChange('XAU/USDT')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
            isGold
              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 shadow-md shadow-yellow-500/10'
              : 'bg-[#0D1117] text-[#8B949E] border-[#21262D] hover:text-white'
          }`}
        >
          <Gem size={14} className={isGold ? 'text-yellow-400' : ''} />
          <span>VÀNG (XAU/USDT)</span>
        </button>

        <button
          type="button"
          onClick={() => onPairChange('BTC/USDT')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
            !isGold
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-md shadow-amber-500/10'
              : 'bg-[#0D1117] text-[#8B949E] border-[#21262D] hover:text-white'
          }`}
        >
          <span className="font-bold text-xs">₿</span>
          <span>BITCOIN (BTC/USDT)</span>
        </button>
      </div>

      <div className="timeframe-selector flex items-center gap-1.5" aria-label="Chọn khung thời gian">
        <span className="text-xs text-[#8B949E] font-medium mr-1">Khung:</span>
        {Object.keys(MARKET_TIMEFRAMES).map((frame) => (
          <button
            key={frame}
            type="button"
            className={`px-3 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
              timeframe === frame
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-[#0D1117] text-[#8B949E] border-[#21262D] hover:text-white'
            }`}
            onClick={() => onTimeframeChange(frame)}
          >
            {frame}
          </button>
        ))}
      </div>
    </section>
  )
}

export function MarketMetrics({ currentPrice, klines = [], pair }) {
  // Tính High, Low thực tế từ danh sách nến thật từ Binance
  const prices = klines && klines.length > 0 ? klines.map((b) => Number(b.close)) : [currentPrice]
  const highs = klines && klines.length > 0 ? klines.map((b) => Number(b.high)) : [currentPrice]
  const lows = klines && klines.length > 0 ? klines.map((b) => Number(b.low)) : [currentPrice]

  const maxPrice = Math.max(...highs)
  const minPrice = Math.min(...lows)
  const firstPrice = prices[0] || currentPrice
  const changePct = firstPrice > 0 ? (((currentPrice - firstPrice) / firstPrice) * 100) : 0

  return (
    <section className="analysis-metrics grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <article className="analysis-metric p-4 bg-[#0D1117] border border-[#21262D] rounded-xl">
        <span className="text-[10px] uppercase font-bold text-[#8B949E] block mb-1">GIÁ BINANCE HIỆN TẠI</span>
        <strong className="text-xl font-mono font-bold text-white block">
          ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </strong>
        <small className="text-[10px] text-emerald-400 font-semibold">{pair} · Live Feed</small>
      </article>

      <article className="analysis-metric p-4 bg-[#0D1117] border border-[#21262D] rounded-xl">
        <span className="text-[10px] uppercase font-bold text-[#8B949E] block mb-1">BIẾN ĐỘNG NẾN PHIÊN</span>
        <strong className={`text-xl font-mono font-bold block ${changePct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
        </strong>
        <small className="text-[10px] text-[#8B949E]">So với đầu phiên</small>
      </article>

      <article className="analysis-metric p-4 bg-[#0D1117] border border-[#21262D] rounded-xl">
        <span className="text-[10px] uppercase font-bold text-[#8B949E] block mb-1">ĐỈNH CAO NHẤT</span>
        <strong className="text-xl font-mono font-bold text-white block">
          ${maxPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </strong>
        <small className="text-[10px] text-[#8B949E]">High thật phiên M5</small>
      </article>

      <article className="analysis-metric p-4 bg-[#0D1117] border border-[#21262D] rounded-xl">
        <span className="text-[10px] uppercase font-bold text-[#8B949E] block mb-1">ĐÁY THẤP NHẤT</span>
        <strong className="text-xl font-mono font-bold text-white block">
          ${minPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </strong>
        <small className="text-[10px] text-[#8B949E]">Low thật phiên M5</small>
      </article>
    </section>
  )
}
