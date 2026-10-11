import { useState } from 'react'
import { AI_SIGNAL_DATA } from '../data/market.js'
import { PageHeading } from '../components/PageHeading.jsx'
import { HistoryDetail } from '../components/history/HistoryDetail.jsx'
import { HistoryFilters } from '../components/history/HistoryFilters.jsx'
import { HistoryTable } from '../components/history/HistoryTable.jsx'

export function HistoryPage({ query }) {
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedId, setSelectedId] = useState(AI_SIGNAL_DATA[0].id)
  const normalizedQuery = query.trim().toLowerCase()
  const rows = AI_SIGNAL_DATA.filter((signal) => (
    (typeFilter === 'ALL' || signal.type === typeFilter)
    && (statusFilter === 'ALL' || signal.status === statusFilter)
    && (!normalizedQuery || `${signal.pair} ${signal.type} ${signal.trend}`.toLowerCase().includes(normalizedQuery))
  )).sort((left, right) => right.createdAt - left.createdAt)
  const selected = rows.find((signal) => signal.id === selectedId) ?? rows[0] ?? null

  return (
    <div className="utility-page">
      <PageHeading eyebrow="SIGNAL ARCHIVE" title="Lịch sử tín hiệu" subtitle="Tra cứu các tín hiệu đã phát sinh và trạng thái xử lý." badge="10 BẢN GHI" />
      <HistoryFilters
        type={typeFilter}
        status={statusFilter}
        resultCount={rows.length}
        onTypeChange={setTypeFilter}
        onStatusChange={setStatusFilter}
      />
      <div className="history-layout">
        <HistoryTable rows={rows} selectedId={selected?.id} onSelect={setSelectedId} />
        <HistoryDetail signal={selected} />
      </div>
    </div>
  )
}
