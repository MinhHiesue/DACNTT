import { useEffect, useRef, useState, useMemo } from 'react'
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  ColorType,
  LineStyle,
  createSeriesMarkers
} from 'lightweight-charts'
import { Maximize2, Layers, Eye, EyeOff, BarChart2, Radio } from 'lucide-react'
import { formatSignalPrice } from '../../data/signalUtils.js'

export function TradingViewCandleChart({
  klines = [],
  signals = [],
  activeSignal = null,
  symbol = 'BTC/USDT',
  timeframe = '5m',
  height = 520
}) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const candleSeriesRef = useRef(null)
  const volumeSeriesRef = useRef(null)
  const markersRef = useRef(null)
  const priceLinesRef = useRef([])

  // Controls state
  const [showVolume, setShowVolume] = useState(true)
  const [showSignalLines, setShowSignalLines] = useState(true)
  const [hoveredCandle, setHoveredCandle] = useState(null)

  // Chuẩn hóa và làm sạch dữ liệu nến (bắt buộc time tăng dần, không trùng lặp)
  const sanitizedKlines = useMemo(() => {
    if (!klines || klines.length === 0) {
      // Dữ liệu mẫu chuẩn nến M5 nếu đang kết nối API
      const nowSec = Math.floor(Date.now() / 1000)
      const count = 100
      let lastClose = 67482.35
      const mockBars = []

      for (let i = count; i >= 0; i--) {
        const t = nowSec - i * 300
        const change = (Math.sin(i * 0.4) * 45) + ((Math.random() - 0.49) * 35)
        const open = lastClose
        const close = open + change
        const high = Math.max(open, close) + Math.random() * 25
        const low = Math.min(open, close) - Math.random() * 25
        const vol = 15 + Math.random() * 50
        lastClose = close
        mockBars.push({
          time: t,
          open: Math.round(open * 100) / 100,
          high: Math.round(high * 100) / 100,
          low: Math.round(low * 100) / 100,
          close: Math.round(close * 100) / 100,
          volume: Math.round(vol * 100) / 100
        })
      }
      return mockBars
    }

    const map = new Map()
    for (const item of klines) {
      const timeSec = item.time > 2000000000 ? Math.floor(item.time / 1000) : Math.floor(item.time)
      map.set(timeSec, {
        time: timeSec,
        open: Number(item.open),
        high: Number(item.high),
        low: Number(item.low),
        close: Number(item.close),
        volume: Number(item.volume || 0)
      })
    }

    return Array.from(map.values()).sort((a, b) => a.time - b.time)
  }, [klines])

  // Khởi tạo biểu đồ TradingView Lightweight Charts
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const chart = createChart(container, {
      width: container.clientWidth,
      height: height,
      layout: {
        background: { type: ColorType.Solid, color: '#0D1117' },
        textColor: '#8B949E',
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: 12
      },
      grid: {
        vertLines: { color: '#161B22' },
        horzLines: { color: '#161B22' }
      },
      crosshair: {
        mode: 1, // Magnet mode
        vertLine: {
          color: '#30363D',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#21262D'
        },
        horzLine: {
          color: '#30363D',
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#21262D'
        }
      },
      rightPriceScale: {
        borderColor: '#21262D',
        scaleMargins: {
          top: 0.1,
          bottom: 0.22 // Chừa không gian bên dưới cho Volume
        }
      },
      timeScale: {
        borderColor: '#21262D',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5
      }
    })

    // Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#089981',
      downColor: '#F23645',
      borderVisible: false,
      wickUpColor: '#089981',
      wickDownColor: '#F23645',
      priceLineVisible: true,
      lastValueVisible: true
    })

    // Volume Series phụ trợ ở đáy biểu đồ
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
      priceLineVisible: false,
      lastValueVisible: false
    })

    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.82,
        bottom: 0.0
      }
    })

    chartRef.current = chart
    candleSeriesRef.current = candleSeries
    volumeSeriesRef.current = volumeSeries

    // Crosshair subscribe để cập nhật thông số nến khi hover
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData) {
        setHoveredCandle(null)
        return
      }
      const data = param.seriesData.get(candleSeries)
      if (data) {
        setHoveredCandle(data)
      }
    })

    // Responsive ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0] && chartRef.current) {
        chartRef.current.applyOptions({
          width: entries[0].contentRect.width
        })
      }
    })
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
      chartRef.current = null
      candleSeriesRef.current = null
      volumeSeriesRef.current = null
      markersRef.current = null
      priceLinesRef.current = []
    }
  }, [height])

  // Cập nhật dữ liệu nến & volume
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || sanitizedKlines.length === 0) return

    candleSeriesRef.current.setData(sanitizedKlines)

    const volumeData = sanitizedKlines.map((bar) => ({
      time: bar.time,
      value: bar.volume,
      color: bar.close >= bar.open ? '#08998144' : '#F2364544'
    }))
    volumeSeriesRef.current.setData(volumeData)

    chartRef.current?.timeScale().fitContent()
  }, [sanitizedKlines])

  // Hiển thị / Ẩn Volume Series
  useEffect(() => {
    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.applyOptions({
        visible: showVolume
      })
    }
  }, [showVolume])

  // Gắn Markers và PriceLines (Entry, SL, TP, Swing Low/High)
  useEffect(() => {
    const candleSeries = candleSeriesRef.current
    if (!candleSeries || sanitizedKlines.length === 0) return

    // 1. Xóa các price lines cũ
    priceLinesRef.current.forEach((line) => {
      try {
        candleSeries.removePriceLine(line)
      } catch (err) {
        // bỏ qua nếu đã giải phóng
      }
    })
    priceLinesRef.current = []

    // 2. Tạo Markers từ danh sách tín hiệu
    const markers = []
    const signalList = signals && signals.length > 0 ? signals : (activeSignal ? [activeSignal] : [])

    for (const sig of signalList) {
      const isLong = sig.direction === 'LONG' || sig.type === 'BUY'
      const sigTime = sig.timestamp_unix || (sig.createdAt ? Math.floor(sig.createdAt / 1000) : null)

      if (sigTime) {
        // Tìm nến gần nhất với thời gian của tín hiệu
        const matchedBar = sanitizedKlines.find((b) => Math.abs(b.time - sigTime) <= 600)
        const targetTime = matchedBar ? matchedBar.time : sanitizedKlines[sanitizedKlines.length - 1].time

        markers.push({
          time: targetTime,
          position: isLong ? 'belowBar' : 'aboveBar',
          color: isLong ? '#089981' : '#F23645',
          shape: isLong ? 'arrowUp' : 'arrowDown',
          text: `${isLong ? 'BUY' : 'SELL'} @ $${formatSignalPrice(sig.entry_price || sig.price)}`
        })
      }
    }

    // Gắn markers vào nến qua createSeriesMarkers
    if (markers.length > 0) {
      if (!markersRef.current) {
        markersRef.current = createSeriesMarkers(candleSeries, markers)
      } else {
        markersRef.current.setMarkers(markers)
      }
    }

    // 3. Nếu bật showSignalLines và có activeSignal, vẽ Entry, SL, TP, Swing
    if (showSignalLines && activeSignal) {
      const isLong = activeSignal.direction === 'LONG' || activeSignal.type === 'BUY'
      const entryPrice = activeSignal.entry_price || activeSignal.price || 0
      const stopLoss = activeSignal.stop_loss || activeSignal.stop || 0
      const takeProfit = activeSignal.take_profit || activeSignal.target || 0
      const deltaSl = activeSignal.delta_sl || Math.abs(entryPrice - stopLoss) || 0
      const deltaTp = activeSignal.delta_tp || Math.abs(takeProfit - entryPrice) || 0
      const rrRatio = activeSignal.rr_ratio || (deltaSl > 0 ? deltaTp / deltaSl : 1.5)

      if (entryPrice > 0) {
        // Entry Price Line (Blue Dashed)
        const entryLine = candleSeries.createPriceLine({
          price: entryPrice,
          color: '#2962FF',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `ENTRY: $${formatSignalPrice(entryPrice)}`
        })
        priceLinesRef.current.push(entryLine)
      }

      if (stopLoss > 0) {
        // Stop Loss Line (Red Solid)
        const slLine = candleSeries.createPriceLine({
          price: stopLoss,
          color: '#F23645',
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `SL: $${formatSignalPrice(stopLoss)} (-$${deltaSl.toFixed(1)})`
        })
        priceLinesRef.current.push(slLine)
      }

      if (takeProfit > 0) {
        // Take Profit Line (Green Solid)
        const tpLine = candleSeries.createPriceLine({
          price: takeProfit,
          color: '#089981',
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `TP: $${formatSignalPrice(takeProfit)} (+$${deltaTp.toFixed(1)} | R:R ${rrRatio.toFixed(1)})`
        })
        priceLinesRef.current.push(tpLine)
      }

      // Khoanh mốc Swing Low / Swing High 15 nến
      if (sanitizedKlines.length >= 15) {
        const setup15 = sanitizedKlines.slice(-15)
        const swingHigh = Math.max(...setup15.map((b) => b.high))
        const swingLow = Math.min(...setup15.map((b) => b.low))

        const swingRefPrice = isLong ? swingLow : swingHigh
        const swingLine = candleSeries.createPriceLine({
          price: swingRefPrice,
          color: isLong ? '#08998188' : '#F2364588',
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `SWING ${isLong ? 'LOW' : 'HIGH'} 15B: $${formatSignalPrice(swingRefPrice)}`
        })
        priceLinesRef.current.push(swingLine)
      }
    }
  }, [sanitizedKlines, signals, activeSignal, showSignalLines])

  const lastBar = sanitizedKlines[sanitizedKlines.length - 1]
  const displayCandle = hoveredCandle || lastBar

  return (
    <div className="relative w-full bg-[#0D1117] border border-[#21262D] rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Chart Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#161B22] border-b border-[#21262D]">
        {/* Pair & Live Feed Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-base tracking-wide font-mono">
              {symbol}
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#21262D] text-cyan-300 border border-[#30363D]">
              {timeframe.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Radio size={12} className="animate-pulse" />
            <span>BINANCE M5 LIVE</span>
          </div>
        </div>

        {/* OHLC Stats Header Display */}
        {displayCandle && (
          <div className="hidden md:flex items-center gap-3 font-mono text-xs text-[#8B949E]">
            <span>
              O: <b className="text-white">${formatSignalPrice(displayCandle.open)}</b>
            </span>
            <span>
              H: <b className="text-[#089981]">${formatSignalPrice(displayCandle.high)}</b>
            </span>
            <span>
              L: <b className="text-[#F23645]">${formatSignalPrice(displayCandle.low)}</b>
            </span>
            <span>
              C:{' '}
              <b
                className={
                  displayCandle.close >= displayCandle.open ? 'text-[#089981]' : 'text-[#F23645]'
                }
              >
                ${formatSignalPrice(displayCandle.close)}
              </b>
            </span>
            {displayCandle.volume > 0 && (
              <span>
                Vol: <b className="text-cyan-300">{displayCandle.volume.toFixed(2)} BTC</b>
              </span>
            )}
          </div>
        )}

        {/* Tool Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowVolume((prev) => !prev)}
            className={`p-1.5 px-2 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
              showVolume
                ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                : 'bg-[#0D1117] text-[#8B949E] border-[#30363D]'
            }`}
            title="Bật/Tắt Volume Sub-series"
          >
            <BarChart2 size={13} />
            <span className="hidden sm:inline">Volume</span>
          </button>

          <button
            onClick={() => setShowSignalLines((prev) => !prev)}
            className={`p-1.5 px-2 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
              showSignalLines
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-[#0D1117] text-[#8B949E] border-[#30363D]'
            }`}
            title="Bật/Tắt đường dóng Entry / SL / TP"
          >
            <Layers size={13} />
            <span className="hidden sm:inline">SL/TP Lines</span>
          </button>

          <button
            onClick={() => chartRef.current?.timeScale().fitContent()}
            className="p-1.5 px-2 bg-[#0D1117] hover:bg-[#21262D] text-[#8B949E] hover:text-white border border-[#30363D] rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
            title="Thu phóng vừa vặn toàn bộ nến"
          >
            <Maximize2 size={13} />
            <span className="hidden sm:inline">Fit</span>
          </button>
        </div>
      </div>

      {/* Lightweight Chart Container */}
      <div ref={containerRef} className="w-full relative" />

      {/* Chart Footer Indicator Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 px-4 bg-[#161B22]/90 border-t border-[#21262D] text-[11px] text-[#8B949E]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#089981]" /> Nến tăng
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#F23645]" /> Nến giảm
          </span>
          {showSignalLines && (
            <>
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-3 h-0.5 border-b-2 border-dashed border-[#2962FF]" /> Entry
              </span>
              <span className="flex items-center gap-1.5 text-[#F23645]">
                <span className="w-3 h-0.5 bg-[#F23645]" /> Stop Loss
              </span>
              <span className="flex items-center gap-1.5 text-[#089981]">
                <span className="w-3 h-0.5 bg-[#089981]" /> Take Profit
              </span>
            </>
          )}
        </div>

        <div className="font-mono text-[10px]">
          TradingView Lightweight Charts v5 · M5 Binance Feed
        </div>
      </div>
    </div>
  )
}
