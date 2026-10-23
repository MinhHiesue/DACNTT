import { ArrowUpRight, MoreHorizontal, Radio } from 'lucide-react'
import { ASSETS } from '../../data/market.js'
import { TradingViewCandleChart } from '../charts/TradingViewCandleChart.jsx'
import { useMarketData } from '../../hooks/useMarketData.js'
import { useSignals } from '../../hooks/useSignals.js'
import { formatSignalPrice } from '../../data/signalUtils.js'

export function MarketOverviewCard({ onNavigate }) {
  const market = ASSETS.btc || { label: 'Bitcoin (Binance)', symbol: 'BTC / USDT', price: 67482.35, change: 1.85 }
  const { klines } = useMarketData('BTCUSDT', 300)
  const { latestSignal, signalsHistory } = useSignals(8000)

  const lastBar = klines && klines.length > 0 ? klines[klines.length - 1] : null
  const currentPrice = lastBar ? lastBar.close : market.price

  return (
    <article className="panel chart-panel">
      <div className="panel-header chart-header">
        <div>
          <div className="panel-kicker">REALTIME PRICE ACTION</div>
          <div className="chart-title-row">
            <h2>BTC/USDT</h2>
            <span className="asset-tag tag-btc">Binance M5</span>
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
        <span className="chart-price-period">Khung M5 · Binance Feed</span>
      </div>

      <div className="my-2">
        <TradingViewCandleChart
          klines={klines}
          signals={signalsHistory}
          activeSignal={latestSignal}
          symbol="BTC/USDT"
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
