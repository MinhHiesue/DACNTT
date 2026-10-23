import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { DashboardHeading } from '../components/dashboard/DashboardHeading.jsx'
import { MarketOverviewCard } from '../components/dashboard/MarketOverviewCard.jsx'
import { OverviewStats } from '../components/dashboard/OverviewStats.jsx'
import { RecentSignalsCard } from '../components/dashboard/RecentSignalsCard.jsx'
import { SystemActivitySection } from '../components/dashboard/SystemActivitySection.jsx'
import { VolumeRegimeGauge } from '../components/market/VolumeRegimeGauge.jsx'
import { useMarketData } from '../hooks/useMarketData.js'

export function DashboardPage({ onNavigate, query }) {
  const [asset, setAsset] = useState('btc')
  const { volumeRegime } = useMarketData('BTCUSDT')

  return (
    <>
      <DashboardHeading asset={asset} setAsset={setAsset} />
      
      {/* Volume Regime Filter Gauge Widget (TASK-05) */}
      <section className="mb-6">
        <VolumeRegimeGauge volumeRegime={volumeRegime} />
      </section>

      <OverviewStats />
      
      <section className="content-grid">
        <MarketOverviewCard asset={asset} setAsset={setAsset} onNavigate={onNavigate} />
        <RecentSignalsCard query={query} onNavigate={onNavigate} />
      </section>
      
      <SystemActivitySection onNavigate={onNavigate} />
      
      <footer className="page-footer">
        <span>© 2026 NORTHSTAR TRADING INTELLIGENCE</span>
        <span><ShieldCheck size={12} /> HỆ THỐNG PHÁT TÍN HIỆU · KHÔNG PHẢI LỜI KHUYÊN ĐẦU TƯ</span>
        <span>BINANCE M5 PATTERN-MATCHING ENGINE</span>
      </footer>
    </>
  )
}
