import { useState } from 'react'
import { ShieldCheck, RefreshCw } from 'lucide-react'
import { TradingViewCandleChart } from '../components/charts/TradingViewCandleChart.jsx'
import { MarketControls, MarketMetrics } from '../components/market/MarketControls.jsx'
import { MarketIndicatorPanel } from '../components/market/MarketIndicatorPanel.jsx'
import { MarketTrendPanel } from '../components/market/MarketTrendPanel.jsx'
import { VolumeRegimeGauge } from '../components/market/VolumeRegimeGauge.jsx'
import { useMarketData } from '../hooks/useMarketData.js'
import { useSignals } from '../hooks/useSignals.js'
import { MARKET_PAIRS } from '../data/market.js'
import { buildMarketCandles, calculateMarketIndicators } from '../data/marketAnalysis.js'

export function MarketAnalysisPage() {
  const [pair, setPair] = useState('BTC/USDT')
  const [timeframe, setTimeframe] = useState('5m')
  const [barLimit, setBarLimit] = useState(1000)

  // Real data hooks
  const { klines, volumeRegime, loading: marketLoading, refresh: refreshMarket } = useMarketData('BTCUSDT', barLimit)
  const { latestSignal, signalsHistory, refresh: refreshSignals } = useSignals(5000)

  const market = MARKET_PAIRS[pair] || MARKET_PAIRS['BTC/USDT']
  const fallbackCandles = buildMarketCandles(pair, timeframe)
  const indicators = calculateMarketIndicators(fallbackCandles)

  // Giá nến mới nhất từ live klines hoặc fallback
  const lastBar = klines && klines.length > 0 ? klines[klines.length - 1] : fallbackCandles[fallbackCandles.length - 1]
  const currentPrice = lastBar.close || lastBar.price || 67482.35
  const currentRsi = indicators.rsi[indicators.rsi.length - 1]?.value ?? 52.4
  const currentMacd = indicators.macd[indicators.macd.length - 1]?.value ?? 14.8

  const handleRefreshAll = () => {
    refreshMarket()
    refreshSignals()
  }

  return (
    <div className="analysis-page">
      {/* Heading */}
      <section className="analysis-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" /> MARKET INTELLIGENCE
            <span className="heading-time">BINANCE BTC/USDT M5</span>
          </div>
          <h1>
            Biểu đồ nến & Phân tích thị trường<span>.</span>
          </h1>
          <p className="page-subtitle">
            Trạm phân tích kỹ thuật thời gian thực từ Binance Public Feed kết hợp đánh giá phân vị Volume và tín hiệu AI.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="analysis-market-state">
            <span className="online-pulse" /> BINANCE LIVE FEED
          </div>
          <button
            onClick={handleRefreshAll}
            className="p-2 bg-[#161B22] hover:bg-[#21262D] text-[#8B949E] hover:text-white rounded-xl border border-[#21262D] transition-colors"
            title="Tải lại nến & tín hiệu"
          >
            <RefreshCw size={14} className={marketLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </section>

      {/* Volume Regime Filter Widget (TASK-05) */}
      <section className="mb-6">
        <VolumeRegimeGauge volumeRegime={volumeRegime} />
      </section>

      {/* Controls & Metrics */}
      <MarketControls
        pair={pair}
        timeframe={timeframe}
        onPairChange={setPair}
        onTimeframeChange={setTimeframe}
      />

      <MarketMetrics market={market} pair={pair} currentPrice={currentPrice} />

      {/* Main Analysis Workspace */}
      <section className="analysis-workspace">
        <article className="panel market-chart-panel">
          {/* TradingView Realtime Candle Chart (TASK-03 & TASK-09) */}
          <TradingViewCandleChart
            klines={klines}
            signals={signalsHistory}
            activeSignal={latestSignal}
            symbol={pair}
            timeframe={timeframe}
            height={560}
            barLimit={barLimit}
            onBarLimitChange={setBarLimit}
          />
        </article>

        <aside className="analysis-side-column">
          <MarketIndicatorPanel
            currentPrice={currentPrice}
            currentRsi={currentRsi}
            currentMacd={currentMacd}
            indicators={indicators}
          />
          <MarketTrendPanel
            timeframe={timeframe}
            market={market}
            currentPrice={currentPrice}
            currentRsi={currentRsi}
            currentMacd={currentMacd}
            indicators={indicators}
          />
        </aside>
      </section>

      <footer className="page-footer">
        <span>© 2026 NORTHSTAR MARKET INTELLIGENCE</span>
        <span>
          <ShieldCheck size={12} /> DỮ LIỆU THỰC TẾ BINANCE API · KHÔNG LIÊN KẾT ĐẶT LỆNH BROKER
        </span>
        <span>BINANCE M5 PATTERN-MATCHING</span>
      </footer>
    </div>
  )
}
