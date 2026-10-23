import { useState, useMemo } from 'react'
import { ArrowDownRight, ArrowRight, ArrowUpRight, MoreHorizontal, Search, SlidersHorizontal, Brain } from 'lucide-react'
import { useSignals } from '../../hooks/useSignals.js'
import { AI_SIGNAL_DATA } from '../../data/market.js'
import { formatSignalPrice } from '../../data/signalUtils.js'

export function RecentSignalsCard({ query = '', onNavigate }) {
  const [filter, setFilter] = useState('ALL')
  const { signalsHistory } = useSignals(8000)

  const activeSignals = useMemo(() => {
    if (signalsHistory && signalsHistory.length > 0) {
      return signalsHistory
    }
    return AI_SIGNAL_DATA
  }, [signalsHistory])

  const visibleSignals = useMemo(() => {
    const q = (query || '').trim().toLowerCase()
    return activeSignals.filter((signal) => {
      const isLong = signal.direction === 'LONG' || signal.type === 'BUY'
      const matchesFilter =
        filter === 'ALL' ||
        (filter === 'BUY' && isLong) ||
        (filter === 'SELL' && !isLong)

      const matchesQuery =
        !q ||
        `${signal.symbol || signal.pair || ''} ${signal.direction || signal.type || ''}`
          .toLowerCase()
          .includes(q)

      return matchesQuery && matchesFilter
    }).slice(0, 4)
  }, [activeSignals, filter, query])

  const buyCount = activeSignals.filter((s) => s.direction === 'LONG' || s.type === 'BUY').length
  const sellCount = activeSignals.filter((s) => s.direction === 'SHORT' || s.type === 'SELL').length

  return (
    <article className="panel signal-panel">
      <div className="panel-header">
        <div>
          <div className="panel-kicker">FAISS PATTERN SCANNER</div>
          <div className="signal-title-row">
            <h2>Tín hiệu gần đây</h2>
            <span className="live-count">
              <span className="online-pulse" /> {activeSignals.length.toString().padStart(2, '0')}
            </span>
          </div>
        </div>
        <button
          className="icon-button more-button"
          aria-label="Mở tất cả tín hiệu AI"
          title="Mở trung tâm tín hiệu AI"
          onClick={() => onNavigate('Tín hiệu AI')}
        >
          <MoreHorizontal size={19} />
        </button>
      </div>

      <div className="signal-summary">
        <span>
          <span className="summary-buy" /> {buyCount} tín hiệu BUY
        </span>
        <span>
          <span className="summary-sell" /> {sellCount} tín hiệu SELL
        </span>
        <button
          onClick={() =>
            setFilter(filter === 'ALL' ? 'BUY' : filter === 'BUY' ? 'SELL' : 'ALL')
          }
        >
          <SlidersHorizontal size={13} /> {filter === 'ALL' ? 'Tất cả' : filter}
        </button>
      </div>

      <div className="signal-list">
        {visibleSignals.length ? (
          visibleSignals.map((signal) => {
            const isLong = signal.direction === 'LONG' || signal.type === 'BUY'
            const isApproved = signal.status === 'APPROVED' || signal.status === 'ACTIVE'
            const entryPrice = signal.entry_price || signal.price || 0
            const stopLoss = signal.stop_loss || signal.stop || 0
            const takeProfit = signal.take_profit || signal.target || 0
            const confidence = signal.confidence <= 1 ? signal.confidence * 100 : signal.confidence

            return (
              <div className="signal-item" key={signal.id}>
                <div className="signal-item-top">
                  <div className="signal-instrument">
                    <span className="signal-coin coin-btc">₿</span>
                    <div>
                      <strong>{signal.symbol || signal.pair}</strong>
                      <small>Binance M5 · {isApproved ? 'Đã duyệt' : 'Từ chối'}</small>
                    </div>
                  </div>
                  <span className={`signal-side ${isLong ? 'side-buy' : 'side-sell'}`}>
                    {isLong ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {isLong ? 'BUY' : 'SELL'}
                  </span>
                </div>

                <div className="signal-item-data">
                  <span>
                    VÀO LỆNH <b>${formatSignalPrice(entryPrice)}</b>
                  </span>
                  <span>
                    FAISS COSINE <b className="confidence-value">{confidence.toFixed(1)}%</b>
                  </span>
                </div>

                <div className="confidence-track">
                  <span style={{ width: `${Math.min(confidence, 100)}%` }} />
                </div>

                <div className="signal-item-bottom">
                  <span>
                    Mục tiêu <b>${formatSignalPrice(takeProfit)}</b>
                  </span>
                  <span>
                    Dừng lỗ <b>${formatSignalPrice(stopLoss)}</b>
                  </span>
                  <time>
                    {signal.timestamp_unix
                      ? new Date(signal.timestamp_unix * 1000).toLocaleTimeString('vi-VN')
                      : 'Vừa xong'}
                  </time>
                </div>
              </div>
            )
          })
        ) : (
          <div className="empty-state">
            <Search size={20} />
            <span>Không tìm thấy tín hiệu phù hợp</span>
          </div>
        )}
      </div>

      <button className="view-all-button" onClick={() => onNavigate('Tín hiệu AI')}>
        Xem trung tâm tín hiệu AI & Soi mẫu <ArrowRight size={14} />
      </button>
    </article>
  )
}
