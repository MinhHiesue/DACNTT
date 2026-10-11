export function MarketIndicatorPanel({ currentPrice, currentRsi, currentMacd, indicators }) {
  const movingAverage = indicators.ma[indicators.ma.length - 1]?.value ?? currentPrice

  return (
    <article className="panel indicators-panel">
      <div className="analysis-panel-heading"><div><div className="panel-kicker">TECHNICALS</div><h2>Chỉ báo kỹ thuật</h2></div><span className="indicator-live-tag">LIVE SIM</span></div>
      <div className="indicator-readout"><div><span>RSI <small>(14)</small></span><strong className={currentRsi > 70 ? 'readout-hot' : currentRsi < 30 ? 'readout-cool' : ''}>{currentRsi.toFixed(1)}</strong></div><span className="indicator-state">{currentRsi > 70 ? 'QUÁ MUA' : currentRsi < 30 ? 'QUÁ BÁN' : 'TRUNG TÍNH'}</span></div>
      <div className="indicator-meter"><span className="rsi-meter-value" style={{ left: `${Math.max(2, Math.min(currentRsi, 98))}%` }} /></div>
      <div className="indicator-scale"><span>0</span><span>30</span><span>50</span><span>70</span><span>100</span></div>
      <div className="indicator-readout macd-readout"><div><span>MACD <small>(12, 26, 9)</small></span><strong className={currentMacd >= 0 ? 'metric-positive' : 'metric-negative'}>{currentMacd >= 0 ? '+' : ''}{currentMacd.toFixed(2)}</strong></div><span className="indicator-state">{currentMacd >= 0 ? 'ĐỘNG LƯỢNG TĂNG' : 'ĐỘNG LƯỢNG GIẢM'}</span></div>
      <div className="ma-readout"><span><i className="ma-line-swatch" /> Đường trung bình MA (20)</span><strong>${movingAverage.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
    </article>
  )
}
