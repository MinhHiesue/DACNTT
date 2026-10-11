import { useState } from 'react'
import { ArrowDownRight, ArrowRight, ArrowUpRight, Gem, MoreHorizontal, Search, SlidersHorizontal } from 'lucide-react'
import { signals } from '../../data/market.js'

export function RecentSignalsCard({ query, onNavigate }) {
  const [filter, setFilter] = useState('Tất cả')
  const visibleSignals = signals.filter((signal) => {
    const matchesQuery = `${signal.pair} ${signal.name} ${signal.type}`.toLowerCase().includes(query.toLowerCase())
    const matchesFilter = filter === 'Tất cả' || signal.type === filter.toUpperCase()
    return matchesQuery && matchesFilter
  })

  return (
    <article className="panel signal-panel">
      <div className="panel-header"><div><div className="panel-kicker">AI MARKET SCANNER</div><div className="signal-title-row"><h2>Tín hiệu gần đây</h2><span className="live-count"><span className="online-pulse" /> 04</span></div></div><button className="icon-button more-button" aria-label="Mở tất cả tín hiệu AI" title="Mở tất cả tín hiệu AI" onClick={() => onNavigate('Tín hiệu AI')}><MoreHorizontal size={19} /></button></div>
      <div className="signal-summary"><span><span className="summary-buy" /> 3 tín hiệu mua</span><span><span className="summary-sell" /> 1 tín hiệu bán</span><button onClick={() => setFilter(filter === 'Tất cả' ? 'Mua' : filter === 'Mua' ? 'Bán' : 'Tất cả')}><SlidersHorizontal size={13} /> {filter}</button></div>
      <div className="signal-list">{visibleSignals.length ? visibleSignals.map((signal) => <div className="signal-item" key={`${signal.pair}-${signal.time}`}>
        <div className="signal-item-top"><div className="signal-instrument"><span className={`signal-coin ${signal.asset === 'gold' ? 'coin-gold' : signal.asset === 'btc' ? 'coin-btc' : 'coin-eth'}`}>{signal.asset === 'gold' ? <Gem size={14} /> : signal.asset === 'btc' ? '₿' : 'Ξ'}</span><div><strong>{signal.pair}</strong><small>{signal.name}</small></div></div><span className={`signal-side ${signal.type === 'MUA' ? 'side-buy' : 'side-sell'}`}>{signal.type === 'MUA' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{signal.type}</span></div>
        <div className="signal-item-data"><span>VÀO LỆNH <b>${signal.price}</b></span><span>ĐỘ TIN CẬY <b className="confidence-value">{signal.confidence}%</b></span></div><div className="confidence-track"><span style={{ width: `${signal.confidence}%` }} /></div>
        <div className="signal-item-bottom"><span>Mục tiêu <b>${signal.target}</b></span><span>Dừng lỗ <b>${signal.stop}</b></span><time>{signal.time}</time></div>
      </div>) : <div className="empty-state"><Search size={20} /><span>Không tìm thấy tín hiệu phù hợp</span></div>}</div>
      <button className="view-all-button" onClick={() => onNavigate('Tín hiệu AI')}>Xem tất cả tín hiệu <ArrowRight size={14} /></button>
    </article>
  )
}
