import { useState, useMemo } from 'react'
import { ShieldCheck, AlertCircle } from 'lucide-react'
import { SignalDetailPanel } from '../components/signals/SignalDetailPanel.jsx'
import { SignalFilters } from '../components/signals/SignalFilters.jsx'
import { SignalStatsGrid } from '../components/signals/SignalStatsGrid.jsx'
import { SignalTable } from '../components/signals/SignalTable.jsx'
import { ActiveSignalHero } from '../components/signals/ActiveSignalHero.jsx'
import { PatternInspectorModal } from '../components/signals/PatternInspectorModal.jsx'
import { ContinuousRadarHud } from '../components/common/ContinuousRadarHud.jsx'
import { useSignals } from '../hooks/useSignals.js'
import { AI_SIGNAL_DATA } from '../data/market.js'
import { getSignalDirection } from '../data/signalUtils.js'

export function AISignalsPage({ query = '' }) {
  const [activeSymbol, setActiveSymbol] = useState('BTCUSDT')
  const {
    latestSignal: liveLatest,
    signalsHistory: liveHistory,
    patternInspector,
    loading,
    error,
    loadInspector
  } = useSignals(5000)

  // Use live signals if available, fallback to normalized default data
  const allSignals = useMemo(() => {
    if (liveHistory && liveHistory.length > 0) {
      return liveHistory
    }
    return AI_SIGNAL_DATA
  }, [liveHistory])

  const [directionFilter, setDirectionFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [timeFilter, setTimeFilter] = useState('7d')
  const [selectedId, setSelectedId] = useState(null)

  // Inspector modal state
  const [isInspectorOpen, setIsInspectorOpen] = useState(false)
  const [inspectedSignal, setInspectedSignal] = useState(null)

  const normalizedQuery = query.trim().toLowerCase()
  const now = Date.now()
  const cutoff = timeFilter === '24h' ? now - 24 * 60 * 60 * 1000
    : timeFilter === '7d' ? now - 7 * 24 * 60 * 60 * 1000
      : timeFilter === '30d' ? now - 30 * 24 * 60 * 60 * 1000
        : 0

  const filteredSignals = useMemo(() => {
    return allSignals.filter((signal) => {
      const direction = getSignalDirection(signal)
      const dirMatch = directionFilter === 'ALL'
        || (directionFilter === 'BUY' && direction === 'BUY')
        || (directionFilter === 'SELL' && direction === 'SELL')

      const isApproved = signal.status === 'APPROVED' || signal.status === 'ACTIVE'
      const statusMatch = statusFilter === 'ALL'
        || (statusFilter === 'APPROVED' && isApproved)
        || (statusFilter === 'REJECTED' && !isApproved)

      const sigTime = signal.timestamp_unix ? signal.timestamp_unix * 1000 : (signal.createdAt || 0)
      const timeMatch = cutoff === 0 || sigTime >= cutoff

      const textMatch = !normalizedQuery
        || `${signal.symbol || signal.pair || ''} ${signal.direction || signal.type || ''} ${signal.status || ''} ${signal.reject_reason || ''}`
          .toLowerCase()
          .includes(normalizedQuery)

      return dirMatch && statusMatch && timeMatch && textMatch
    }).sort((a, b) => {
      const timeA = a.timestamp_unix ? a.timestamp_unix * 1000 : (a.createdAt || 0)
      const timeB = b.timestamp_unix ? b.timestamp_unix * 1000 : (b.createdAt || 0)
      return timeB - timeA
    })
  }, [allSignals, directionFilter, statusFilter, cutoff, normalizedQuery])

  // Select signal
  const activeSignal = liveLatest || allSignals[0] || null
  const selectedSignal = useMemo(() => {
    if (selectedId) {
      const found = allSignals.find((s) => s.id === selectedId)
      if (found) return found
    }
    return filteredSignals[0] || activeSignal
  }, [selectedId, allSignals, filteredSignals, activeSignal])

  // Stats calculation
  const stats = useMemo(() => {
    const total = allSignals.length
    const buyCount = allSignals.filter((signal) => getSignalDirection(signal) === 'BUY').length
    const sellCount = allSignals.filter((signal) => getSignalDirection(signal) === 'SELL').length
    const approvedCount = allSignals.filter((s) => s.status === 'APPROVED' || s.status === 'ACTIVE').length
    const rejectedCount = allSignals.filter((s) => s.status === 'REJECTED').length
    return { total, buyCount, sellCount, approvedCount, rejectedCount }
  }, [allSignals])

  const handleOpenInspector = async (signal) => {
    setInspectedSignal(signal || selectedSignal)
    setIsInspectorOpen(true)
    await loadInspector()
  }

  return (
    <div className="ai-signals-page">
      {/* Page Heading */}
      <section className="signals-page-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" /> SIGNAL CENTER
            <span className="heading-time">BINANCE BTC/USDT M5</span>
          </div>
          <h1>
            Tín hiệu AI & Ký ức mẫu hình<span>.</span>
          </h1>
          <p className="page-subtitle">
            Hệ thống phát hiện tín hiệu thời gian thực sử dụng FAISS Cosine Similarity và lọc rủi ro Swing R:R.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {error && (
            <div className="px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs flex items-center gap-1.5">
              <AlertCircle size={13} />
              <span>Chế độ ngoại tuyến / Fallback</span>
            </div>
          )}
        </div>
      </section>

      {/* Radar HUD liên tục */}
      <ContinuousRadarHud onNavigate={null} />

      {/* Active Signal Hero Card (1 mã tối đa 1 setup, chờ duyệt / following) */}
      <ActiveSignalHero
        activeSymbol={activeSymbol}
        onSelectSymbol={setActiveSymbol}
        onOpenInspector={handleOpenInspector}
      />

      {/* Stats Grid */}
      <SignalStatsGrid
        totalCount={stats.total}
        approvedCount={stats.approvedCount}
        buyCount={stats.buyCount}
        sellCount={stats.sellCount}
        rejectedCount={stats.rejectedCount}
      />

      {/* Signal Workspace */}
      <section className="signal-workspace">
        <article className="panel signal-table-panel">
          <div className="signal-table-heading">
            <div>
              <div className="panel-kicker">FAISS MATCHED SIGNALS</div>
              <h2>
                Danh sách tín hiệu <span>{filteredSignals.length}</span>
              </h2>
            </div>
            <div className="signal-updated">
              <span className="online-pulse" /> TỰ ĐỘNG CẬP NHẬT
            </div>
          </div>

          <SignalFilters
            direction={directionFilter}
            status={statusFilter}
            time={timeFilter}
            onDirectionChange={setDirectionFilter}
            onStatusChange={setStatusFilter}
            onTimeChange={setTimeFilter}
          />

          <SignalTable
            signals={filteredSignals}
            selectedId={selectedSignal?.id}
            onSelect={setSelectedId}
            onOpenInspector={handleOpenInspector}
          />

          <div className="signal-table-foot">
            <span>
              Đang hiển thị {filteredSignals.length} / {allSignals.length} tín hiệu
            </span>
            <span>Chọn một dòng để xem phân tích hoặc bấm "Soi mẫu"</span>
          </div>
        </article>

        {/* Detail Panel */}
        <SignalDetailPanel
          signal={selectedSignal}
          onOpenInspector={handleOpenInspector}
        />
      </section>

      {/* Pattern Memory Inspector Modal */}
      <PatternInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        signal={inspectedSignal || selectedSignal}
        inspectorData={patternInspector}
      />

      <footer className="page-footer">
        <span>© 2026 NORTHSTAR AI TRADING ENGINE</span>
        <span>
          <ShieldCheck size={12} /> DỮ LIỆU TÍN HIỆU THẬT · KHÔNG LIÊN KẾT BROKER
        </span>
        <span>M5 FAISS PATTERN-MATCHING</span>
      </footer>
    </div>
  )
}
