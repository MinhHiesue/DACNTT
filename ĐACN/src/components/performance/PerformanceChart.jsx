export function PerformanceChart({ model }) {
  return (
    <section className="panel performance-chart-panel">
      <div className="utility-section-heading"><div><div className="panel-kicker">CUMULATIVE SIMULATED RETURN</div><h2>{model.name} <span>{model.version}</span></h2></div><span className="performance-period">30 NGÀY</span></div>
      <div className="performance-chart"><div className="performance-y-axis"><span>+10%</span><span>+5%</span><span>0%</span><span>-5%</span></div><div className="performance-plot"><div className="performance-gridlines"><i /><i /><i /><i /></div><div className="performance-bars">{model.bars.map((height, index) => <i key={`${index}-${height}`} style={{ height: `${height}%` }} />)}</div></div></div>
      <div className="performance-x-axis"><span>01 THG</span><span>07 THG</span><span>14 THG</span><span>21 THG</span><span>HÔM NAY</span></div>
      <p className="performance-note">Kết quả mô phỏng từ dữ liệu mẫu, không đại diện cho lợi nhuận thực tế.</p>
    </section>
  )
}
