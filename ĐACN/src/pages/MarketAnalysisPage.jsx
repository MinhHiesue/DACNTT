import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { MarketChartSet } from '../components/charts/MarketChartSet.jsx'
import { MarketControls, MarketMetrics } from '../components/market/MarketControls.jsx'
import { MarketIndicatorPanel } from '../components/market/MarketIndicatorPanel.jsx'
import { MarketTrendPanel } from '../components/market/MarketTrendPanel.jsx'
import { VolumeRegimeGauge } from '../components/market/VolumeRegimeGauge.jsx'
import { useMarketData } from '../hooks/useMarketData.js'
import { MARKET_PAIRS } from '../data/market.js'
import { buildMarketCandles, calculateMarketIndicators } from '../data/marketAnalysis.js'

export function MarketAnalysisPage() {
  const [pair, setPair] = useState('BTC/USDT')
  const [timeframe, setTimeframe] = useState('5m')
  const [showMa, setShowMa] = useState(true)

  const { volumeRegime } = useMarketData('BTCUSDT')

  const market = MARKET_PAIRS[pair] || MARKET_PAIRS['BTC/USDT']
  const candles = buildMarketCandles(pair, timeframe)
  const indicators = calculateMarketIndicators(candles)
  const currentPrice = candles[candles.length - 1].close
  const currentRsi = indicators.rsi[indicators.rsi.length - 1]?.value ?? 50
  const currentMacd = indicators.macd[indicators.macd.length - 1]?.value ?? 0

  return (
    <div className="analysis-page">
      <section className="analysis-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" /> MARKET INTELLIGENCE
            <span className="heading-time">BINANCE M5 LIVE REGIME</span>
          </div>
          <h1>
            Phân tích thị trường<span>.</span>
          </h1>
          <p className="page-subtitle">
            Giám sát vi mô cấu trúc thanh khoản, bộ lọc Volume Regime P20-P85 và hành vi giá nến M5.
          </p>
        </div>
        <div className="analysis-market-state">
          <span className="online-pulse" /> BINANCE API KẾT NỐI
        </div>
      </section>

      {/* Volume Regime Filter Widget (TASK-05) */}
      <section className="mb-6">
        <VolumeRegimeGauge volumeRegime={volumeRegime} />
      </section>

      <MarketControls
        pair={pair}
        timeframe={timeframe}
        onPairChange={setPair}
        onTimeframeChange={setTimeframe}
      />

      <MarketMetrics market={market} pair={pair} currentPrice={currentPrice} />

      <section className="analysis-workspace">
        <article className="panel market-chart-panel">
          <div className="analysis-panel-heading">
            <div>
              <div className="panel-kicker">PRICE ACTION · {timeframe.toUpperCase()}</div>
              <div className="chart-title-row">
                <h2>{pair}</h2>
                <span className="asset-tag tag-btc">{market.name}</span>
              </div>
            </div>
            <div className="chart-tools">
              <label>
                <input
                  type="checkbox"
                  checked={showMa}
                  onChange={(event) => setShowMa(event.target.checked)}
                />
                <span className="ma-line-swatch" /> MA 20
              </label>
              <span className="ohlc-legend">
                <i className="ohlc-up" /> Tăng <i className="ohlc-down" /> Giảm
              </span>
            </div>
          </div>
          <MarketChartSet pair={pair} timeframe={timeframe} showMa={showMa} />
          <div className="market-chart-foot">
            <span>
              <i className="legend-dot legend-blue" /> MA 20 <b>·</b> <i className="ohlc-up" /> Tăng <b>·</b> <i className="ohlc-down" /> Giảm
            </span>
            <span>DỮ LIỆU NẾN THỊ TRƯỜNG M5</span>
          </div>
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
          <ShieldCheck size={12} /> HỆ THỐNG PHÁT TÍN HIỆU · KHÔNG PHẢI LỜI KHUYÊN ĐẦU TƯ
        </span>
        <span>BINANCE DATA ENGINE</span>
      </footer>
    </div>
  )
}
