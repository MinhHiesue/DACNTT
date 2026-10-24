import { MARKET_PAIRS, MARKET_TIMEFRAMES } from './market.js'

export function buildMarketCandles(pair, timeframe) {
  const market = MARKET_PAIRS[pair]
  const interval = MARKET_TIMEFRAMES[timeframe]
  const count = 120
  const end = Math.floor(Date.now() / 1000 / interval) * interval
  let previous = market.base * (1 - market.change / 100 * 0.65)

  return Array.from({ length: count }, (_, index) => {
    const progress = index / (count - 1)
    const wave = Math.sin(index * 0.53) * 0.003 + Math.cos(index * 0.19) * 0.002
    const drift = (market.change / 100) * (progress - 1)
    const finalWave = Math.sin((count - 1) * 0.53) * 0.003 + Math.cos((count - 1) * 0.19) * 0.002
    const close = market.base * (1 + drift + wave - finalWave)
    const open = previous
    const spread = market.base * (0.001 + Math.abs(Math.sin(index * 1.27)) * 0.0014)
    previous = close
    return {
      time: end - (count - index - 1) * interval,
      open,
      high: Math.max(open, close) + spread,
      low: Math.min(open, close) - spread,
      close,
    }
  })
}

function calculateEma(values, period) {
  const smoothing = 2 / (period + 1)
  return values.reduce((result, value, index) => {
    result.push(index === 0 ? value : value * smoothing + result[index - 1] * (1 - smoothing))
    return result
  }, [])
}

export function calculateMarketIndicators(candles) {
  const closes = candles.map((candle) => candle.close)
  const ma = closes.map((_, index) => index < 19 ? null : closes.slice(index - 19, index + 1).reduce((sum, value) => sum + value, 0) / 20)
  const rsi = closes.map((_, index) => {
    if (index < 14) return null
    const changes = closes.slice(index - 13, index + 1).map((value, offset) => value - closes[index - 14 + offset])
    const gains = changes.reduce((sum, value) => sum + Math.max(value, 0), 0) / 14
    const losses = changes.reduce((sum, value) => sum + Math.max(-value, 0), 0) / 14
    return losses === 0 ? 100 : 100 - 100 / (1 + gains / losses)
  })
  const fast = calculateEma(closes, 12)
  const slow = calculateEma(closes, 26)
  const macd = fast.map((value, index) => value - slow[index])
  const signal = calculateEma(macd, 9)
  return {
    ma: ma.flatMap((value, index) => value === null ? [] : [{ time: candles[index].time, value }]),
    rsi: rsi.flatMap((value, index) => value === null ? [] : [{ time: candles[index].time, value }]),
    macd: macd.map((value, index) => ({ time: candles[index].time, value })),
    signal: signal.map((value, index) => ({ time: candles[index].time, value })),
    histogram: macd.map((value, index) => ({ time: candles[index].time, value: value - signal[index], color: value >= signal[index] ? '#61d4a0' : '#ff786b' })),
  }
}
