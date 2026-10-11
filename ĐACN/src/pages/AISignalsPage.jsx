import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { SignalDetailPanel } from '../components/signals/SignalDetailPanel.jsx'
import { SignalFilters } from '../components/signals/SignalFilters.jsx'
import { SignalStatsGrid } from '../components/signals/SignalStatsGrid.jsx'
import { SignalTable } from '../components/signals/SignalTable.jsx'
import { AI_SIGNAL_DATA } from '../data/market.js'

export function AISignalsPage({ query }) {
  const [pairFilter, setPairFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [timeFilter, setTimeFilter] = useState('7d')
  const [selectedId, setSelectedId] = useState('sig-01')
  const normalizedQuery = query.trim().toLowerCase()
  const cutoff = timeFilter === '24h' ? Date.now() - 24 * 60 * 60 * 1000
    : timeFilter === '7d' ? Date.now() - 7 * 24 * 60 * 60 * 1000
      : timeFilter === '30d' ? Date.now() - 30 * 24 * 60 * 60 * 1000
        : 0
  const filteredSignals = AI_SIGNAL_DATA.filter((signal) => (
    (pairFilter === 'ALL' || signal.pair === pairFilter)
    && (typeFilter === 'ALL' || signal.type === typeFilter)
    && signal.createdAt >= cutoff
    && (!normalizedQuery || `${signal.pair} ${signal.type} ${signal.trend}`.toLowerCase().includes(normalizedQuery))
  )).sort((left, right) => right.createdAt - left.createdAt)
  const selectedSignal = filteredSignals.find((signal) => signal.id === selectedId) ?? filteredSignals[0] ?? null

  return (
    <div className="ai-signals-page">
      <section className="signals-page-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> SIGNAL CENTER <span className="heading-time">DỮ LIỆU MÔ PHỎNG</span></div><h1>Tín hiệu AI<span>.</span></h1><p className="page-subtitle">Theo dõi tín hiệu và xem phân tích tại thời điểm phát hiện.</p></div><div className="signals-source"><span className="online-pulse" /> MẪU · KHÔNG ĐẶT LỆNH</div></section>
      <SignalStatsGrid
        signals={AI_SIGNAL_DATA}
        buyCount={AI_SIGNAL_DATA.filter((signal) => signal.type === 'BUY').length}
        sellCount={AI_SIGNAL_DATA.filter((signal) => signal.type === 'SELL').length}
        holdCount={AI_SIGNAL_DATA.filter((signal) => signal.type === 'HOLD').length}
      />
      <section className="signal-workspace">
        <article className="panel signal-table-panel">
          <div className="signal-table-heading"><div><div className="panel-kicker">GENERATED SIGNALS</div><h2>Danh sách tín hiệu <span>{filteredSignals.length}</span></h2></div><div className="signal-updated"><span className="online-pulse" /> DỮ LIỆU MẪU</div></div>
          <SignalFilters
            pair={pairFilter}
            type={typeFilter}
            time={timeFilter}
            onPairChange={setPairFilter}
            onTypeChange={setTypeFilter}
            onTimeChange={setTimeFilter}
          />
          <SignalTable signals={filteredSignals} selectedId={selectedSignal?.id} onSelect={setSelectedId} />
          <div className="signal-table-foot"><span>Đang hiển thị {filteredSignals.length} / {AI_SIGNAL_DATA.length} tín hiệu mẫu</span><span>Chọn một dòng để xem phân tích</span></div>
        </article>
        <SignalDetailPanel signal={selectedSignal} />
      </section>
      <footer className="page-footer"><span>© 2026 NORTHSTAR MARKET INTELLIGENCE</span><span><ShieldCheck size={12} /> DỮ LIỆU MẪU · KHÔNG ĐẶT LỆNH</span><span>AI SIGNAL CENTER</span></footer>
    </div>
  )
}
