# TASK-03: TÁI CẤU TRÚC BIỂU ĐỒ TRADINGVIEW M5 (LIVE MARKERS & SL/TP LINES)

## 1. TRẠNG THÁI (STATUS)
* **Trạng thái hiện tại:** 🔲 Chưa bắt đầu (Pending)
* **Người phụ trách:** Frontend Dev / UI Engineer
* **Độ ưu tiên:** Khẩn cấp (P0 - Linh hồn trực quan của hệ thống)
* **Phụ thuộc:** [TASK-01](file:///d:/DACNTT-1/ĐACN/plan/task_01_backend_api_fastapi_and_data_bridge.md), [TASK-02](file:///d:/DACNTT-1/ĐACN/plan/task_02_clean_frontend_architecture_and_data_contracts.md)

---

## 2. MỤC ĐÍCH (PURPOSE)
Nâng cấp biểu đồ TradingView Lightweight Charts hiện tại thành một trạm quan sát phân tích kỹ thuật thời gian thực (Realtime Charting Station): Hiển thị nến BTC/USDT M5 từ Binance, đồng thời gắn trực tiếp các **mũi tên tín hiệu BUY/SELL** và các **đường dóng mức giá Entry, Stop Loss, Take Profit** ngay trên biểu đồ khi hệ thống AI phát hiện mẫu hình.

---

## 3. MỤC TIÊU CHI TIẾT (OBJECTIVES)
* [ ] Tích hợp thư viện `lightweight-charts` hiển thị Candlestick Series trên nền Dark Mode Fintech cao cấp (`#0D1117`).
* [ ] Hiển thị Volume Series phụ trợ ở đáy biểu đồ, tự động đổi màu theo nến tăng (xanh lá `#089981`) và nến giảm (đỏ `#F23645`).
* [ ] **Cơ chế gắn Markers tín hiệu (`setMarkers`):**
  * Tín hiệu LONG: Mũi tên xanh lá chỉ lên (`arrowUp`) đặt dưới đáy nến, chú thích `BUY @ [Giá]`.
  * Tín hiệu SHORT: Mũi tên đỏ chỉ xuống (`arrowDown`) đặt trên đỉnh nến, chú thích `SELL @ [Giá]`.
* [ ] **Vẽ đường dóng giá động (`createPriceLine`):**
  * Đường Entry: Nét đứt màu xanh dương `#2962FF`, nhãn `Entry: [Giá]`.
  * Đường Stop Loss: Nét liền màu đỏ `#F23645`, nhãn `SL: [Giá] (-$Δ)`.
  * Đường Take Profit: Nét liền màu xanh lá `#089981`, nhãn `TP: [Giá] (+$Δ)`.
* [ ] **Khoanh vùng cửa sổ setup 15 nến:** Hiển thị mốc Swing Low và Swing High của 15 nến gần nhất để người dùng thấy rõ căn cứ đặt Stop Loss của Risk Manager.
* [ ] Thanh công cụ trực quan: Hiển thị giá hiện tại, mức biến động 24h, badge trạng thái `● LIVE BINANCE FEED`, các nút Zoom/Fit biểu đồ.

---

## 4. BẢN THIẾT KẾ KỸ THUẬT (TECHNICAL DESIGN)

### 4.1. Vị trí component:
* `src/components/charts/TradingViewCandleChart.jsx`
* Thay thế biểu đồ cũ trong `src/pages/MarketAnalysisPage.jsx` và `src/pages/DashboardPage.jsx`.

### 4.2. Khung hiện thực logic:
```javascript
import { createChart } from 'lightweight-charts'
import { useEffect, useRef } from 'react'

export function TradingViewCandleChart({ klines, activeSignal }) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const candleSeriesRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: { background: { color: '#0D1117' }, textColor: '#8B949E' },
      grid: { vertLines: { color: '#161B22' }, horzLines: { color: '#161B22' } },
      crosshair: { mode: 1 },
      timeScale: { timeVisible: true, secondsVisible: false },
    })

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#089981', downColor: '#F23645',
      borderUpColor: '#089981', borderDownColor: '#F23645',
      wickUpColor: '#089981', wickDownColor: '#F23645',
    })

    candleSeries.setData(klines)

    // Nếu có activeSignal, gắn Marker và đường dóng giá
    if (activeSignal && activeSignal.status === 'APPROVED') {
      candleSeries.setMarkers([{
        time: activeSignal.timestampUnix,
        position: activeSignal.direction === 'LONG' ? 'belowBar' : 'aboveBar',
        color: activeSignal.direction === 'LONG' ? '#089981' : '#F23645',
        shape: activeSignal.direction === 'LONG' ? 'arrowUp' : 'arrowDown',
        text: `${activeSignal.direction} @ ${activeSignal.entryPrice.toFixed(2)}`,
      }])

      // Vẽ Entry, SL, TP
      candleSeries.createPriceLine({
        price: activeSignal.entryPrice,
        color: '#2962FF',
        lineWidth: 2,
        lineStyle: 2, // Dashed
        title: 'ENTRY',
      })
      candleSeries.createPriceLine({
        price: activeSignal.stopLoss,
        color: '#F23645',
        lineWidth: 2,
        lineStyle: 0, // Solid
        title: `SL (${activeSignal.deltaSl.toFixed(1)})`,
      })
      candleSeries.createPriceLine({
        price: activeSignal.takeProfit,
        color: '#089981',
        lineWidth: 2,
        lineStyle: 0, // Solid
        title: `TP (R:R ${activeSignal.rrRatio.toFixed(1)})`,
      })
    }

    chart.timeScale().fitContent()
    return () => chart.remove()
  }, [klines, activeSignal])

  return <div ref={containerRef} className="w-full h-[520px] rounded-xl overflow-hidden border border-[#21262D]" />
}
```

---

## 5. CHECKLIST NGHIỆM THU (TICKBOX)
- [ ] Render thành công nến M5 thật từ Binance trên canvas TradingView.
- [ ] Tự động cập nhật nến mới nhất khi có WebSocket/Polling.
- [ ] Gắn marker mũi tên BUY/SELL chuẩn xác tại nến sinh tín hiệu.
- [ ] Hiển thị 3 đường dóng ngang: Entry (Xanh dương), SL (Đỏ), TP (Xanh lá) với nhãn giá rõ ràng.
- [ ] Thử nghiệm co giãn màn hình (Responsive) biểu đồ tự điều chỉnh kích thước (`resizeObserver`).
