import { useEffect, useRef } from 'react'
import { AreaSeries, ColorType, createChart } from 'lightweight-charts'
import { ASSETS } from '../../data/market.js'

function makeSeries(assetKey, range) {
  const base = ASSETS[assetKey].price
  const count = range === '1D' ? 48 : range === '1W' ? 84 : 90
  const step = range === '1D' ? 30 * 60 : range === '1W' ? 2 * 60 * 60 : 8 * 60 * 60
  const now = Math.floor(Date.now() / 1000)
  let previous = base * 0.982
  return Array.from({ length: count }, (_, index) => {
    const wave = Math.sin(index * 0.38) * 0.0018 + Math.cos(index * 0.13) * 0.0012
    const drift = (index / count) * 0.014
    const close = base * (0.982 + drift + wave)
    const open = previous
    const spread = base * (0.0009 + Math.abs(Math.sin(index * 1.77)) * 0.0008)
    const time = now - (count - index) * step
    previous = close
    return { time, value: close, open, high: Math.max(open, close) + spread, low: Math.min(open, close) - spread }
  })
}

export function PriceChart({ asset, range }) {
  const host = useRef(null)
  const chart = useRef(null)
  const series = useRef(null)

  useEffect(() => {
    if (!host.current) return undefined
    const instance = createChart(host.current, {
      width: host.current.clientWidth,
      height: 290,
      layout: { background: { type: ColorType.Solid, color: '#101820' }, textColor: '#74828d', fontFamily: 'DM Mono, monospace', fontSize: 11 },
      grid: { vertLines: { color: '#1c2730' }, horzLines: { color: '#1c2730' } },
      rightPriceScale: { borderColor: '#26323b', scaleMargins: { top: 0.14, bottom: 0.12 } },
      timeScale: { borderColor: '#26323b', timeVisible: range === '1D', secondsVisible: false, rightOffset: 3 },
      crosshair: { vertLine: { color: '#74828d', labelBackgroundColor: '#263640' }, horzLine: { color: '#74828d', labelBackgroundColor: '#263640' } },
      handleScroll: true,
      handleScale: true,
    })
    const line = instance.addSeries(AreaSeries, {
      lineColor: ASSETS[asset].color,
      topColor: `${ASSETS[asset].color}45`,
      bottomColor: `${ASSETS[asset].color}00`,
      lineWidth: 2,
      priceLineVisible: true,
      lastValueVisible: true,
      crosshairMarkerRadius: 4,
    })
    line.setData(makeSeries(asset, range).map(({ time, value }) => ({ time, value })))
    instance.timeScale().fitContent()
    chart.current = instance
    series.current = line
    const observer = new ResizeObserver(([entry]) => {
      if (entry && chart.current) chart.current.applyOptions({ width: entry.contentRect.width })
    })
    observer.observe(host.current)
    return () => {
      observer.disconnect()
      instance.remove()
      chart.current = null
      series.current = null
    }
  }, [asset, range])

  return <div className="chart-host" ref={host} aria-label={`Biểu đồ ${ASSETS[asset].symbol}`} />
}
