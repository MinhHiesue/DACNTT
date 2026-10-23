import { ArrowUpRight, MoreHorizontal, Radio } from 'lucide-react'
import { ASSETS } from '../../data/market.js'
import { TradingViewCandleChart } from '../charts/TradingViewCandleChart.jsx'
import { useMarketData } from '../../hooks/useMarketData.js'
import { useSignals } from '../../hooks/useSignals.js'
import { formatSignalPrice } from '../../data/signalUtils.js'

export function MarketOverviewCard({ asset = 'gold', onNavigate }) {
  const isGold = asset === 'gold' || asset === 'xau'
  const currentSymbol = isGold ? 'XAUUSDT' : 'BTCUSDT'
  const displayPair = isGold ? 'XAU/USDT' : 'BTC/USDT'
  const market = (isGold ? ASSETS.gold : ASSETS.btc) || { label: 'Vàng vĩnh cửu (Binance Futures)', symbol: 'XAU / USDT', price: 4005.50, change: 0.85 }
  const { klines } = useMarketData(currentSymbol, 300)
  const { latestSignal, signalsHistory } = useSignals(8000)

  const lastBar = klines && klines.length > 0 ? klines[klines.length - 1] : null
  const currentPrice = lastBar ? lastBar.close : market.price

  return (
    <article className="panel chart-panel">
      <div className="panel-header chart-header">
        <div>
          <div className="panel-kicker">REALTIME PRICE ACTION</div>
          <div className="chart-title-row">
            <h2>{displayPair}</h2>
            <span className={`asset-tag ${isGold ? 'tag-gold' : 'tag-btc'}`}>{isGold ? 'Vàng Futures M5' : 'Binance M5'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
            <Radio size={11} className="animate-pulse" />
            <span>LIVE</span>
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

      <div className="chart-price-row">
        <strong>${formatSignalPrice(currentPrice)}</strong>
        <span className="positive-change">
          <ArrowUpRight size={14} /> +{market.change}%
        </span>
        <span className="chart-price-period">Khung M5 · Binance Futures Feed</span>
      </div>

      <div className="my-2">
        <TradingViewCandleChart
          klines={klines}
          signals={signalsHistory}
          activeSignal={latestSignal}
          symbol={displayPair}
          timeframe="5m"
          height={320}
        />
      </div>

      <div className="chart-legend">
        <span>
          <i className="legend-dot legend-blue" /> Binance M5 <b>·</b> Nến & Tín hiệu AI
        </span>
        <span>NGUỒN: BINANCE PUBLIC API</span>
      </div>
    </article>
  )
}
