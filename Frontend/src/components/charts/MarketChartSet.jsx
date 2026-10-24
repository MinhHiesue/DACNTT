import { useEffect, useRef } from 'react'
import { CandlestickSeries, ColorType, HistogramSeries, LineSeries, createChart } from 'lightweight-charts'
import { buildMarketCandles, calculateMarketIndicators } from '../../data/marketAnalysis.js'

export function MarketChartSet({ pair, timeframe, showMa }) {
  const priceHost = useRef(null)
  const rsiHost = useRef(null)
  const macdHost = useRef(null)

  useEffect(() => {
    if (!priceHost.current || !rsiHost.current || !macdHost.current) return undefined
    const candles = buildMarketCandles(pair, timeframe)
    const values = calculateMarketIndicators(candles)
    const sharedOptions = (host, height) => ({
      width: host.clientWidth,
      height,
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: '#0d161d' }, textColor: '#83929b', fontFamily: 'Rajdhani, sans-serif', fontSize: 12 },
      grid: { vertLines: { color: '#1b2932' }, horzLines: { color: '#1b2932' } },
      rightPriceScale: { borderColor: '#30434e', scaleMargins: { top: 0.12, bottom: 0.12 } },
      timeScale: { borderColor: '#30434e', timeVisible: timeframe !== '1d', secondsVisible: false, rightOffset: 3 },
      crosshair: { vertLine: { color: '#718792', labelBackgroundColor: '#28414f' }, horzLine: { color: '#718792', labelBackgroundColor: '#28414f' } },
      handleScroll: true,
      handleScale: true,
    })
    const priceChart = createChart(priceHost.current, sharedOptions(priceHost.current, 350))
    const candlesSeries = priceChart.addSeries(CandlestickSeries, {
      upColor: '#58d49c', downColor: '#ff7469', borderVisible: false,
      wickUpColor: '#58d49c', wickDownColor: '#ff7469',
      priceLineVisible: true,
    })
    candlesSeries.setData(candles)
    if (showMa) {
      const maSeries = priceChart.addSeries(LineSeries, {
        color: '#62c8ff', lineWidth: 2, title: 'MA 20', priceLineVisible: false,
        lastValueVisible: true,
      })
      maSeries.setData(values.ma)
    }
    priceChart.timeScale().fitContent()

    const rsiChart = createChart(rsiHost.current, sharedOptions(rsiHost.current, 112))
    const rsiSeries = rsiChart.addSeries(LineSeries, { color: '#ba9cff', lineWidth: 2, priceLineVisible: false, lastValueVisible: true, title: 'RSI' })
    rsiSeries.setData(values.rsi)
    rsiSeries.createPriceLine({ price: 70, color: '#ff7469', lineStyle: 2, axisLabelVisible: true, title: '70' })
    rsiSeries.createPriceLine({ price: 30, color: '#58d49c', lineStyle: 2, axisLabelVisible: true, title: '30' })
    rsiChart.priceScale('right').applyOptions({ autoScale: false, scaleMargins: { top: 0.05, bottom: 0.05 } })
    rsiChart.timeScale().fitContent()

    const macdChart = createChart(macdHost.current, sharedOptions(macdHost.current, 128))
    const histogramSeries = macdChart.addSeries(HistogramSeries, { priceLineVisible: false, lastValueVisible: false, base: 0 })
    histogramSeries.setData(values.histogram)
    const macdSeries = macdChart.addSeries(LineSeries, { color: '#62c8ff', lineWidth: 2, priceLineVisible: false, title: 'MACD' })
    macdSeries.setData(values.macd)
    const signalSeries = macdChart.addSeries(LineSeries, { color: '#ff9c72', lineWidth: 1, priceLineVisible: false, title: 'Signal' })
    signalSeries.setData(values.signal)
    macdChart.timeScale().fitContent()

    return () => {
      priceChart.remove()
      rsiChart.remove()
      macdChart.remove()
    }
  }, [pair, timeframe, showMa])

  return <div className="analysis-charts">
    <div className="analysis-main-chart" ref={priceHost} aria-label={`${pair} candlestick chart with moving average`} />
    <div className="indicator-chart-wrap"><div className="indicator-chart-heading"><strong>RSI <span>14</span></strong><span>Quá mua 70 · Quá bán 30</span></div><div className="indicator-chart rsi-chart" ref={rsiHost} aria-label="RSI indicator chart" /></div>
    <div className="indicator-chart-wrap"><div className="indicator-chart-heading"><strong>MACD <span>12 · 26 · 9</span></strong><span>MACD <i className="macd-legend-blue" /> Signal <i className="macd-legend-coral" /></span></div><div className="indicator-chart macd-chart" ref={macdHost} aria-label="MACD indicator chart" /></div>
  </div>
}
