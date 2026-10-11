import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { DashboardHeading } from '../components/dashboard/DashboardHeading.jsx'
import { MarketOverviewCard } from '../components/dashboard/MarketOverviewCard.jsx'
import { OverviewStats } from '../components/dashboard/OverviewStats.jsx'
import { RecentSignalsCard } from '../components/dashboard/RecentSignalsCard.jsx'
import { SystemActivitySection } from '../components/dashboard/SystemActivitySection.jsx'

export function DashboardPage({ onNavigate, query }) {
  const [asset, setAsset] = useState('gold')

  return (
    <>
      <DashboardHeading asset={asset} setAsset={setAsset} />
      <OverviewStats />
      <section className="content-grid">
        <MarketOverviewCard asset={asset} setAsset={setAsset} onNavigate={onNavigate} />
        <RecentSignalsCard query={query} onNavigate={onNavigate} />
      </section>
      <SystemActivitySection onNavigate={onNavigate} />
      <footer className="page-footer">
        <span>© 2026 NORTHSTAR MARKET INTELLIGENCE</span>
        <span><ShieldCheck size={12} /> GIAO DIỆN DEMO · KHÔNG PHẢI LỜI KHUYÊN ĐẦU TƯ</span>
        <span>ĐƯỢC THIẾT KẾ TẠI VIỆT NAM <span className="footer-star">✳</span></span>
      </footer>
    </>
  )
}
