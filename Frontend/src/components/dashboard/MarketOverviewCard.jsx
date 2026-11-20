import { useEffect } from 'react'
import { ArrowUpRight, MoreHorizontal, Radio, CheckCircle2, Clock, Gem } from 'lucide-react'
import { TradingViewCandleChart } from '../charts/TradingViewCandleChart.jsx'
import { useMarketData } from '../../hooks/useMarketData.js'
import { useTradeManager } from '../../context/TradeSetupContext.jsx'
import { formatSignalPrice } from '../../data/signalUtils.js'

export function MarketOverviewCard({ asset = 'gold', setAsset, onNavigate }) {
  const isGold = asset === 'gold' || asset === 'xau'
  const currentSymbol = isGold ? 'XAUUSDT' : 'BTCUSDT'
  const displayPair = isGold ? 'XAU/USDT' : 'BTC/USDT'
  
  // Nạp 100% nến thật từ Binance qua API
  const { klines, loading } = useMarketData(currentSymbol, 300)
  
  const { getSetupForSymbol, evaluatePriceUpdate } = useTradeManager()
  const liveSetup = getSetupForSymbol(currentSymbol)

  const lastBar = klines && klines.length > 0 ? klines[klines.length - 1] : null
  const currentPrice = lastBar ? lastBar.close : 0

  // Liên tục kiểm tra giá Live đối chiếu với setup (Invalidation / TP / SL)
  useEffect(() => {
    if (currentPrice > 0) {
      evaluatePriceUpdate(currentSymbol, currentPrice)
    }
  }, [currentPrice, currentSymbol, evaluatePriceUpdate])

  return (
    <article className="panel chart-panel">
      <div className="panel-header chart-header flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="panel-kicker">REALTIME BINANCE PRICE ACTION</div>
          
          {/* NÚT CHUYỂN ĐỔI CHART TRỰC TIẾP: VÀNG VÀ BITCOIN */}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1 p-1 bg-[#161B22] border border-[#30363D] rounded-xl">
              <button
                type="button"
                onClick={() => setAsset && setAsset('gold')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isGold
                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 shadow-md shadow-yellow-500/10'
                    : 'text-[#8B949E] border-transparent hover:text-white'
                }`}
              >
                <Gem size={13} className={isGold ? 'text-yellow-400' : ''} />
                <span>VÀNG (XAU/USDT)</span>
              </button>

              <button
                type="button"
                onClick={() => setAsset && setAsset('btc')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  !isGold
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-md shadow-amber-500/10'
                    : 'text-[#8B949E] border-transparent hover:text-white'
                }`}
              >
                <span className="font-bold text-xs">₿</span>
                <span>BITCOIN (BTC/USDT)</span>
              </button>
            </div>

            {liveSetup && (
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                liveSetup.status === 'FOLLOWING' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {liveSetup.status === 'FOLLOWING' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                {liveSetup.status === 'FOLLOWING' ? '1 LỆNH LIVE' : '1 ĐỀ XUẤT CHỜ DUYỆT'} ({liveSetup.direction} @ ${formatSignalPrice(liveSetup.entry_price)})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
            <Radio size={11} className="animate-pulse" />
            <span>BINANCE LIVE</span>
          </div>
          <button
            className="icon-button more-button"
            aria-label="Mở phân tích thị trường"
            title="Mở phân tích thị trường đầy đủ"
            onClick={() => onNavigate('Phân tích thị trường')}
          >
            <MoreHorizontal size={19} />
          </button>
        </div>
      </div>

      {/* Hiển thị Giá Realtime Thật từ Binance */}
      <div className="chart-price-row mt-2">
        <strong className="text-2xl font-mono">
          {currentPrice > 0 ? `$${formatSignalPrice(currentPrice)}` : 'Đang đồng bộ giá...'}
        </strong>
        <span className="positive-change text-emerald-400 font-semibold text-xs ml-2">
          <ArrowUpRight size={14} className="inline" /> Dữ liệu trực tiếp
        </span>
        <span className="chart-price-period ml-3 text-xs text-[#8B949E]">Khung M5 · Binance Public API</span>
      </div>

      <div className="my-2">
        <TradingViewCandleChart
          klines={klines}
          signals={liveSetup ? [liveSetup] : []}
          activeSignal={liveSetup}
          symbol={displayPair}
          timeframe="5m"
          height={320}
        />
      </div>

      <div className="chart-legend flex items-center justify-between text-xs text-[#8B949E] pt-2 border-t border-[#21262D]">
        <span>
          <i className="legend-dot legend-blue" /> {liveSetup ? `Đang hiển thị 1 setup ${liveSetup.direction} duy nhất (${displayPair})` : `Biểu đồ sạch · Chưa có setup live trên ${displayPair}`}
        </span>
        <span className="font-mono text-[11px]">NGUỒN THẬT: BINANCE API (100% NO MOCK)</span>
      </div>
    </article>
  )
}
