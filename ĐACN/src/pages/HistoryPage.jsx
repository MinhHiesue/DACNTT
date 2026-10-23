import { useState, useMemo } from 'react'
import { AI_SIGNAL_DATA } from '../data/market.js'
import { PageHeading } from '../components/PageHeading.jsx'
import { HistoryDetail } from '../components/history/HistoryDetail.jsx'
import { HistoryFilters } from '../components/history/HistoryFilters.jsx'
import { HistoryTable } from '../components/history/HistoryTable.jsx'
import { useSignals } from '../hooks/useSignals.js'

export function HistoryPage({ query }) {
  const { signalsHistory } = useSignals(8000)

  const allRecords = useMemo(() => {
    if (signalsHistory && signalsHistory.length > 0) {
      return signalsHistory
    }
    return AI_SIGNAL_DATA
  }, [signalsHistory])

  const [typeFilter, setTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedId, setSelectedId] = useState(allRecords[0]?.id)

  const normalizedQuery = (query || '').trim().toLowerCase()

  const rows = useMemo(() => {
    return allRecords.filter((signal) => {
      const isLong = signal.direction === 'LONG' || signal.type === 'BUY'
      const typeMatch =
        typeFilter === 'ALL' ||
        (typeFilter === 'BUY' && isLong) ||
        (typeFilter === 'SELL' && !isLong)

      const isApproved = signal.status === 'APPROVED' || signal.status === 'ACTIVE'
      const statusMatch =
        statusFilter === 'ALL' ||
        (statusFilter === 'APPROVED' && isApproved) ||
        (statusFilter === 'REJECTED' && !isApproved)

      const textMatch =
        !normalizedQuery ||
        `${signal.symbol || signal.pair || ''} ${signal.direction || signal.type || ''} ${signal.status || ''}`
          .toLowerCase()
          .includes(normalizedQuery)

      return typeMatch && statusMatch && textMatch
    }).sort((a, b) => {
      const timeA = a.timestamp_unix ? a.timestamp_unix * 1000 : (a.createdAt || 0)
      const timeB = b.timestamp_unix ? b.timestamp_unix * 1000 : (b.createdAt || 0)
      return timeB - timeA
    })
  }, [allRecords, typeFilter, statusFilter, normalizedQuery])

  const selected = rows.find((s) => s.id === selectedId) || rows[0] || null

  return (
    <div className="utility-page">
      <PageHeading
        eyebrow="SIGNAL ARCHIVE"
        title="Lịch sử tín hiệu AI"
        subtitle="Tra cứu các tín hiệu đã phát sinh từ thuật toán FAISS và kết quả xử lý của Risk Manager."
        badge={`${rows.length} BẢN GHI`}
      />
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
