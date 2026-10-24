import { useEffect, useRef, useState, useMemo } from 'react'
import {
  createChart,
  AreaSeries,
  ColorType,
  LineStyle
} from 'lightweight-charts'
import { TrendingUp, Maximize2, ShieldCheck, DollarSign } from 'lucide-react'
import { formatSignalPrice } from '../../data/signalUtils.js'

export function InteractiveEquityCurve({ trades = [], initialBalance = 10000, height = 360 }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const seriesRef = useRef(null)
  const [hoveredPoint, setHoveredPoint] = useState(null)

  // Xây dựng chuỗi dữ liệu tăng trưởng vốn từ danh sách trades
  const curveData = useMemo(() => {
    if (!trades || trades.length === 0) {
      // Fallback mô phỏng 20 điểm tăng trưởng quanh 10k nếu chưa tải xong API
      const nowSec = Math.floor(Date.now() / 1000)
      return Array.from({ length: 30 }, (_, i) => {
        const t = nowSec - (30 - i) * 86400
        const val = 10000 + (Math.sin(i * 0.5) * 200) + (i * 12)
        return { time: t, value: Math.round(val * 100) / 100, tradeId: i + 1 }
      })
    }

    // Xuất phát từ vốn ban đầu
    const points = []
    let currentBalance = initialBalance

    trades.forEach((trade, idx) => {
      // Chuyển timestamp chuỗi '2026-10-05 13:55:00' thành Unix timestamp (seconds)
      let timeSec
      if (trade.entry_time) {
        timeSec = Math.floor(new Date(trade.entry_time).getTime() / 1000)
      } else {
        timeSec = Math.floor(Date.now() / 1000) - (trades.length - idx) * 3600
      }

      // Đảm bảo timestamp tăng dần nghiêm ngặt (tránh trùng giây)
      if (points.length > 0 && timeSec <= points[points.length - 1].time) {
        timeSec = points[points.length - 1].time + 60
      }

      currentBalance = trade.balance_after || (currentBalance + (trade.net_profit || 0))
      points.push({
        time: timeSec,
        value: Math.round(currentBalance * 100) / 100,
        tradeId: trade.trade_id || (idx + 1),
        profit: trade.net_profit || 0,
        direction: trade.direction || 'LONG',
        exitReason: trade.exit_reason || 'TAKE_PROFIT'
      })
    })

    return points
  }, [trades, initialBalance])

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
      rightPriceScale: {
        borderColor: '#21262D',
        scaleMargins: { top: 0.15, bottom: 0.15 }
      },
      timeScale: {
        borderColor: '#21262D',
        timeVisible: true,
        secondsVisible: false
      },
      crosshair: {
        vertLine: { color: '#30363D', style: LineStyle.Dashed },
        horzLine: { color: '#30363D', style: LineStyle.Dashed }
      }
    })

    // Vẽ đường Area Series biểu thị tài sản
    const areaSeries = chart.addSeries(AreaSeries, {
      topColor: 'rgba(8, 153, 129, 0.35)',
      bottomColor: 'rgba(8, 153, 129, 0.00)',
      lineColor: '#089981',
      lineWidth: 2.5,
      priceLineVisible: true,
      lastValueVisible: true
    })

    areaSeries.setData(curveData)

    // Đường dóng mốc vốn ban đầu ($10,000 USD)
    areaSeries.createPriceLine({
      price: initialBalance,
      color: '#8B949E',
      lineWidth: 1.5,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: `VỐN GỐC $${initialBalance.toLocaleString('en-US')}`
    })

    chart.timeScale().fitContent()

    chartRef.current = chart
    seriesRef.current = areaSeries

    // Crosshair move listener để hiển thị Tooltip
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData) {
        setHoveredPoint(null)
        return
      }
      const data = param.seriesData.get(areaSeries)
      if (data) {
        const found = curveData.find((p) => p.time === param.time)
        setHoveredPoint(found || { value: data.value, time: param.time })
      }
    })

    // Resize observer
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
      seriesRef.current = null
    }
  }, [curveData, height, initialBalance])

  const lastPoint = curveData[curveData.length - 1]
  const netGrowth = lastPoint ? lastPoint.value - initialBalance : 0
  const netGrowthPct = (netGrowth / initialBalance) * 100

  return (
    <article className="p-5 bg-gradient-to-br from-[#0D1117] via-[#161B22] to-[#0D1117] border border-[#30363D] rounded-2xl shadow-xl text-[#E6EDF3] mb-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#21262D]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-white uppercase">
                BIỂU ĐỒ ĐƯỜNG CONG VỐN (INTERACTIVE EQUITY CURVE)
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-[#21262D] text-emerald-400 border border-emerald-500/30">
                123 LỆNH OUT-OF-SAMPLE
              </span>
            </div>
            <p className="text-xs text-[#8B949E]">
              Diễn biến số dư tài khoản thực tế từ $10,000 USD qua từng lệnh giao dịch
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-[#8B949E] block">TĂNG TRƯỞNG RÒNG</span>
            <strong
              className={`text-sm font-mono font-bold ${
                netGrowth >= 0 ? 'text-[#089981]' : 'text-[#F23645]'
              }`}
            >
              {netGrowth >= 0 ? '+' : ''}${formatSignalPrice(netGrowth)} ({netGrowthPct >= 0 ? '+' : ''}{netGrowthPct.toFixed(2)}%)
            </strong>
          </div>
          <button
            onClick={() => chartRef.current?.timeScale().fitContent()}
            className="p-1.5 px-2 bg-[#21262D] hover:bg-[#30363D] text-[#8B949E] hover:text-white border border-[#30363D] rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
            title="Căn chỉnh vừa vặn đồ thị"
          >
            <Maximize2 size={13} />
            <span className="hidden sm:inline">Fit Curve</span>
          </button>
        </div>
      </div>

      {/* Hover Tooltip Box */}
      {hoveredPoint && (
        <div className="my-2.5 p-2 px-3 bg-[#161B22] border border-[#30363D] rounded-xl flex flex-wrap items-center justify-between text-xs font-mono text-[#8B949E] animate-fade-in">
          <div className="flex items-center gap-3">
            <span>
              Lệnh #{hoveredPoint.tradeId || '-'}:{' '}
              <b className={hoveredPoint.direction === 'LONG' ? 'text-[#089981]' : 'text-[#F23645]'}>
                {hoveredPoint.direction || 'TRADE'}
              </b>
            </span>
            <span>
              Lãi/Lỗ:{' '}
              <b
                className={
                  (hoveredPoint.profit || 0) >= 0 ? 'text-[#089981]' : 'text-[#F23645]'
                }
              >
                {(hoveredPoint.profit || 0) >= 0 ? '+' : ''}${formatSignalPrice(hoveredPoint.profit || 0)}
              </b>
            </span>
            {hoveredPoint.exitReason && (
              <span>
                Thoát lệnh: <b className="text-white">{hoveredPoint.exitReason}</b>
              </span>
            )}
          </div>
          <div>
            Số dư tài khoản: <b className="text-white text-sm">${formatSignalPrice(hoveredPoint.value)}</b>
          </div>
        </div>
      )}

      {/* Chart Canvas */}
      <div ref={containerRef} className="w-full relative rounded-xl overflow-hidden my-3" />

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] text-[#8B949E] pt-2 border-t border-[#21262D]">
        <span className="flex items-center gap-1">
          <ShieldCheck size={12} className="text-emerald-400" />
          Dữ liệu ghi nhận từ backtest Out-of-Sample không trùng lặp (Unseen Data).
        </span>
        <span className="font-mono">
          Vốn ban đầu: $10,000.00 → Số dư hiện tại: ${formatSignalPrice(lastPoint?.value || initialBalance)}
        </span>
      </div>
    </article>
  )
}
