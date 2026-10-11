import { ArrowUpRight, Cpu, Signal, Sparkles, TrendingUp } from 'lucide-react'

function TargetIcon() {
  return <span className="target-icon"><span /></span>
}

export function OverviewStats() {
  return (
    <section className="stat-grid" aria-label="Thống kê tổng quan">
      <article className="stat-card"><div className="stat-head"><span>TỶ LỆ CHÍNH XÁC</span><span className="stat-icon blue-stat"><TargetIcon /></span></div><div className="stat-main"><strong>78.4<span>%</span></strong><span className="stat-trend"><ArrowUpRight size={14} /> 2.6%</span></div><div className="stat-foot">Trên 126 tín hiệu gần nhất</div><div className="sparkline spark-blue"><span style={{ '--spark': '22%' }} /><span style={{ '--spark': '36%' }} /><span style={{ '--spark': '30%' }} /><span style={{ '--spark': '55%' }} /><span style={{ '--spark': '48%' }} /><span style={{ '--spark': '70%' }} /><span style={{ '--spark': '62%' }} /><span style={{ '--spark': '88%' }} /><span style={{ '--spark': '79%' }} /><span style={{ '--spark': '100%' }} /></div></article>
      <article className="stat-card"><div className="stat-head"><span>TÍN HIỆU HÔM NAY</span><span className="stat-icon gold-stat"><Signal size={16} /></span></div><div className="stat-main"><strong>12</strong><span className="stat-trend">+3 so với hôm qua</span></div><div className="stat-foot">8 lệnh mua <i /> 4 lệnh bán</div><div className="stat-progress"><span /></div></article>
      <article className="stat-card"><div className="stat-head"><span>HIỆU SUẤT TUẦN</span><span className="stat-icon green-stat"><TrendingUp size={16} /></span></div><div className="stat-main"><strong>+8.26<span>%</span></strong><span className="stat-trend"><ArrowUpRight size={14} /> 1.8%</span></div><div className="stat-foot">So với tuần trước</div><div className="mini-bars"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></article>
      <article className="stat-card"><div className="stat-head"><span>CHIẾN LƯỢC HOẠT ĐỘNG</span><span className="stat-icon violet-stat"><Cpu size={16} /></span></div><div className="stat-main"><strong>04</strong><span className="live-pill"><span className="online-pulse" /> ĐANG CHẠY</span></div><div className="stat-foot">Phân tích đa khung thời gian</div><div className="strategy-foot"><span><Sparkles size={12} /> Northstar AI</span><span>v2.4.1</span></div></article>
    </section>
  )
}
