import { MARKET_PAIRS, MARKET_TIMEFRAMES } from '../../data/market.js'

export function MarketControls({ pair, timeframe, onPairChange, onTimeframeChange }) {
  return (
    <section className="analysis-toolbar">
      <div className="pair-selector" aria-label="Chọn cặp giao dịch">{Object.entries(MARKET_PAIRS).map(([symbol, details]) => <button key={symbol} className={pair === symbol ? 'pair-selected' : ''} onClick={() => onPairChange(symbol)}><strong>{symbol}</strong><span>{details.name}</span></button>)}</div>
      <div className="timeframe-selector" aria-label="Chọn khung thời gian">{Object.keys(MARKET_TIMEFRAMES).map((frame) => <button key={frame} className={timeframe === frame ? 'timeframe-selected' : ''} onClick={() => onTimeframeChange(frame)}>{frame}</button>)}</div>
    </section>
  )
}

export function MarketMetrics({ market, pair, currentPrice }) {
  return (
    <section className="analysis-metrics">
      <article className="analysis-metric"><span>GIÁ HIỆN TẠI</span><strong>${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong><small>{pair}</small></article>
      <article className="analysis-metric"><span>BIẾN ĐỘNG 24H</span><strong className={market.change >= 0 ? 'metric-positive' : 'metric-negative'}>{market.change >= 0 ? '+' : ''}{market.change.toFixed(2)}%</strong><small>So với 24 giờ trước</small></article>
      <article className="analysis-metric"><span>CAO NHẤT 24H</span><strong>${market.high.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong><small>High · 24 giờ</small></article>
      <article className="analysis-metric"><span>THẤP NHẤT 24H</span><strong>${market.low.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong><small>Low · 24 giờ</small></article>
    </section>
  )
}
