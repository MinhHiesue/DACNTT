import { useEffect, useRef, useState, useMemo } from 'react'
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  ColorType,
  LineStyle,
  createSeriesMarkers
} from 'lightweight-charts'
import {
  Maximize2,
  Minimize2,
  Layers,
  BarChart2,
  Radio,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Sliders
} from 'lucide-react'
import { formatSignalPrice } from '../../data/signalUtils.js'

export function TradingViewCandleChart({
  klines = [],
  signals = [],
  activeSignal = null,
  symbol = 'BTC/USDT',
  timeframe = '5m',
  height = 540,
  barLimit = 1000,
  onBarLimitChange = null
}) {
  const wrapperRef = useRef(null)
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const candleSeriesRef = useRef(null)
  const volumeSeriesRef = useRef(null)
  const markersRef = useRef(null)
  const priceLinesRef = useRef([])

  // Controls state
  const [showVolume, setShowVolume] = useState(true)
  const [showSignalLines, setShowSignalLines] = useState(false)
  const [hoveredCandle, setHoveredCandle] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Chuẩn hóa và làm sạch dữ liệu nến (bắt buộc time tăng dần, không trùng lặp)
  const sanitizedKlines = useMemo(() => {
    if (!klines || klines.length === 0) {
      // Dữ liệu mẫu chuẩn nến M5 nếu đang kết nối API
      const nowSec = Math.floor(Date.now() / 1000)
      const count = 300
      let lastClose = 67482.35
      const mockBars = []

      for (let i = count; i >= 0; i--) {
        const t = nowSec - i * 300
        const change = (Math.sin(i * 0.25) * 65) + ((Math.random() - 0.49) * 45)
        const open = lastClose
        const close = open + change
        const high = Math.max(open, close) + Math.random() * 30
        const low = Math.min(open, close) - Math.random() * 30
        const vol = 15 + Math.random() * 60
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

  // Khởi tạo biểu đồ TradingView Lightweight Charts chuẩn Pro
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const chartHeight = isFullscreen ? window.innerHeight - 120 : height

    const chart = createChart(container, {
      width: container.clientWidth,
      height: chartHeight,
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
      // THƯỚC ĐO GIÁ: Hỗ trợ co giãn tự do theo chiều dọc
      rightPriceScale: {
        borderColor: '#21262D',
        autoScale: true,
        scaleMargins: {
          top: 0.08,
          bottom: 0.22 // Chừa không gian bên dưới cho Volume
        },
        entireTextOnly: false
      },
      // THƯỚC THỜI GIAN: Hỗ trợ siêu Zoom cực xa và cực gần
      timeScale: {
        borderColor: '#21262D',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,        // Khoảng trống bên phải nến hiện tại chuẩn TradingView
        barSpacing: 8,          // Độ rộng nến ban đầu tối ưu
        minBarSpacing: 0.5,     // Cho phép zoom thu nhỏ cực đại như Binance thật!
        maxBarSpacing: 50,      // Cho phép zoom phóng to cực đại
        fixLeftEdge: false,     // Tự do cuộn lùi về quá khứ sâu
        fixRightEdge: false,
        lockVisibleTimeRangeOnResize: false,
        shiftVisibleRangeOnNewBar: true
      },
      // THAO TÁC CHUỘT: Co giãn đa trục chuẩn TradingView
      handleScale: {
        mouseWheel: true,       // Lăn chuột phóng to/thu nhỏ mượt mà
        pinch: true,
        axisPressedMouseMove: {
          time: true,           // Kéo rê thước thời gian để zoom ngang
          price: true           // Kéo rê thước giá bên phải để nén/giãn chiều cao nến!
        },
        axisDoubleClickReset: {
          time: true,           // Nhấp đúp chuột lên thước để reset
          price: true           // Nhấp đúp chuột lên thước giá để tự động cân bằng tỷ lệ nến
        }
      },
      // CUỘN BIỂU ĐỒ:
      handleScroll: {
        mouseWheel: false,      // Tránh bị cuộn dọc mất kiểm soát
        pressedMouseMove: true, // Giữ chuột trái rê để kéo biểu đồ qua lại tự do
        horzTouchDrag: true,
        vertTouchDrag: true
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
          width: entries[0].contentRect.width,
          height: isFullscreen ? window.innerHeight - 120 : height
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
  }, [height, isFullscreen])

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
        // bỏ qua
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

  // Lắng nghe sự kiện Fullscreen của trình duyệt
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  const toggleFullscreen = () => {
    if (!wrapperRef.current) return
    if (!document.fullscreenElement) {
      wrapperRef.current.requestFullscreen().catch((err) => {
        console.warn('Lỗi mở toàn màn hình:', err)
      })
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn('Lỗi thoát toàn màn hình:', err)
      })
    }
  }

  // Zoom Helpers
  const handleZoomIn = () => {
    if (!chartRef.current) return
    const ts = chartRef.current.timeScale()
    const current = ts.options().barSpacing || 8
    ts.applyOptions({ barSpacing: Math.min(50, current * 1.35) })
  }

  const handleZoomOut = () => {
    if (!chartRef.current) return
    const ts = chartRef.current.timeScale()
    const current = ts.options().barSpacing || 8
    ts.applyOptions({ barSpacing: Math.max(0.5, current * 0.75) })
  }

  const handleResetView = () => {
    if (!chartRef.current) return
    chartRef.current.timeScale().fitContent()
    chartRef.current.priceScale('right').applyOptions({ autoScale: true })
  }

  const lastBar = sanitizedKlines[sanitizedKlines.length - 1]
  const displayCandle = hoveredCandle || lastBar
  const deltaPrice = displayCandle ? displayCandle.close - displayCandle.open : 0
  const deltaPct = displayCandle && displayCandle.open ? (deltaPrice / displayCandle.open) * 100 : 0
  const isUp = deltaPrice >= 0

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full bg-[#0D1117] border border-[#21262D] rounded-2xl overflow-hidden shadow-2xl transition-all ${
        isFullscreen ? 'p-4 rounded-none h-screen flex flex-col justify-between' : ''
      }`}
    >
      {/* Top Chart Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#161B22] border-b border-[#21262D]">
        {/* Left: Pair, Timeframe, Live Feed Badge */}
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
            <span>BINANCE FEED</span>
          </div>

          {/* Depth Range Presets Selector */}
          {onBarLimitChange && (
            <div className="hidden sm:flex items-center bg-[#0D1117] p-0.5 rounded-lg border border-[#30363D] text-[11px] font-mono">
              {[150, 500, 1000, 1500].map((count) => (
                <button
                  key={count}
                  onClick={() => onBarLimitChange(count)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    barLimit === count
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-[#8B949E] hover:text-white'
                  }`}
                  title={`Tải ${count} nến lịch sử`}
                >
                  {count}B
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center: TradingView-style Floating HUD (OHLC & % change) */}
        {displayCandle && (
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-[#8B949E]">
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
              <b className={isUp ? 'text-[#089981]' : 'text-[#F23645]'}>
                ${formatSignalPrice(displayCandle.close)}
              </b>
            </span>
            <span className={`font-semibold ${isUp ? 'text-[#089981]' : 'text-[#F23645]'}`}>
              {isUp ? '+' : ''}${formatSignalPrice(deltaPrice)} ({isUp ? '+' : ''}{deltaPct.toFixed(2)}%)
            </span>
            {displayCandle.volume > 0 && (
              <span className="hidden lg:inline text-cyan-300">
                Vol: <b>{displayCandle.volume.toFixed(2)} BTC</b>
              </span>
            )}
          </div>
        )}

        {/* Right: Zoom In/Out, Fit, SL/TP, Fullscreen Controls */}
        <div className="flex items-center gap-1.5">
          {/* Zoom Out (-) */}
          <button
            onClick={handleZoomOut}
            className="p-1.5 px-2 bg-[#0D1117] hover:bg-[#21262D] text-[#8B949E] hover:text-white border border-[#30363D] rounded-lg text-xs font-semibold flex items-center transition-colors"
            title="Thu nhỏ biểu đồ (Zoom Out)"
          >
            <ZoomOut size={13} />
          </button>

          {/* Zoom In (+) */}
          <button
            onClick={handleZoomIn}
            className="p-1.5 px-2 bg-[#0D1117] hover:bg-[#21262D] text-[#8B949E] hover:text-white border border-[#30363D] rounded-lg text-xs font-semibold flex items-center transition-colors"
            title="Phóng to biểu đồ (Zoom In)"
          >
            <ZoomIn size={13} />
          </button>

          {/* Reset View */}
          <button
            onClick={handleResetView}
            className="p-1.5 px-2 bg-[#0D1117] hover:bg-[#21262D] text-[#8B949E] hover:text-white border border-[#30363D] rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
            title="Căn chỉnh vừa vặn & Reset tỷ lệ nến"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Fit</span>
          </button>

          {/* Toggle Volume */}
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
            <span className="hidden md:inline">Vol</span>
          </button>

          {/* Toggle SL/TP lines */}
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
            <span className="hidden md:inline">Lines</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
              isFullscreen
                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                : 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 hover:from-blue-600/30 hover:to-cyan-600/30 text-cyan-300 border-cyan-500/40'
            }`}
            title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Mở toàn màn hình (Fullscreen Terminal)'}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span className="hidden sm:inline">
              {isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            </span>
          </button>
        </div>
      </div>

      {/* Lightweight Chart Canvas Container */}
      <div
        ref={containerRef}
        className={`w-full relative ${isFullscreen ? 'flex-1 my-2' : ''}`}
        style={isFullscreen ? {} : { height: `${height}px` }}
      />

      {/* Pro Chart Footer Legend & User Guide */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 px-4 bg-[#161B22]/95 border-t border-[#21262D] text-[11px] text-[#8B949E]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#089981]" /> Nến tăng
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#F23645]" /> Nến giảm
          </span>
          {showSignalLines && (
            <>
              <span className="flex items-center gap-1 text-blue-400">
                <span className="w-2.5 h-0.5 border-b-2 border-dashed border-[#2962FF]" /> Entry
              </span>
              <span className="flex items-center gap-1 text-[#F23645]">
                <span className="w-2.5 h-0.5 bg-[#F23645]" /> SL
              </span>
              <span className="flex items-center gap-1 text-[#089981]">
                <span className="w-2.5 h-0.5 bg-[#089981]" /> TP
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 font-mono text-[10px]">
          <span className="text-cyan-400/80 hidden md:inline">
            💡 Mẹo Pro: Kéo chuột trên thước đo giá bên phải để nén/giãn nến · Nhấp đúp để reset
          </span>
          <span>Đang hiển thị {sanitizedKlines.length} nến M5</span>
        </div>
      </div>
    </div>
  )
}
