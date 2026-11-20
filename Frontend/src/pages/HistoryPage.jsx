import { useState, useMemo } from 'react'
import { AI_SIGNAL_DATA } from '../data/market.js'
import { PageHeading } from '../components/PageHeading.jsx'
import { HistoryDetail } from '../components/history/HistoryDetail.jsx'
import { HistoryFilters } from '../components/history/HistoryFilters.jsx'
import { HistoryTable } from '../components/history/HistoryTable.jsx'
import { useSignals } from '../hooks/useSignals.js'

function formatSymbol(symbol) {
  if (!symbol) return '—'
  const match = symbol.match(/^(.+?)(USDT|USDC|BUSD|BTC|ETH)$/)
  return match ? `${match[1]}/${match[2]}` : symbol
}

function normalizeSignal(signal, index, seenIds) {
  const direction = signal.direction?.toUpperCase()
  const type = signal.type?.toUpperCase() ?? (
    direction === 'LONG' ? 'BUY' : direction === 'SHORT' ? 'SELL' : 'HOLD'
  )
  const baseId = String(signal.id ?? `history-${index}`)
  const duplicateCount = seenIds.get(baseId) ?? 0
  seenIds.set(baseId, duplicateCount + 1)

  return {
    ...signal,
    id: duplicateCount ? `${baseId}-${duplicateCount}` : baseId,
    pair: signal.pair ?? formatSymbol(signal.symbol),
    type,
    price: signal.price ?? signal.entry_price,
    createdAt: signal.createdAt ?? (signal.timestamp_unix ? signal.timestamp_unix * 1000 : signal.timestamp),
    analysis: signal.analysis ?? signal.reject_reason ?? signal.ai_model ?? 'Không có thông tin phân tích.',
    trend: signal.trend ?? direction ?? 'Không xác định',
  }
}

export function HistoryPage({ query }) {
  const { signalsHistory } = useSignals(8000)

  const allRecords = useMemo(() => {
    if (signalsHistory && signalsHistory.length > 0) {
      const seenIds = new Map()
      return signalsHistory.map((signal, index) => normalizeSignal(signal, index, seenIds))
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
      const isShort = signal.direction === 'SHORT' || signal.type === 'SELL'
      const typeMatch =
        typeFilter === 'ALL' ||
        (typeFilter === 'BUY' && isLong) ||
        (typeFilter === 'SELL' && isShort)

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
