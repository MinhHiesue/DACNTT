import { useState } from 'react'
import { ArrowUpRight, MoreHorizontal } from 'lucide-react'
import { ASSETS } from '../../data/market.js'
import { PriceChart } from '../charts/PriceChart.jsx'

export function MarketOverviewCard({ asset, setAsset, onNavigate }) {
  const [range, setRange] = useState('1D')
  const market = ASSETS[asset]

  return (
    <article className="panel chart-panel">
      <div className="panel-header chart-header">
        <div><div className="panel-kicker">PHÂN TÍCH GIÁ</div><div className="chart-title-row"><h2>{market.symbol}</h2><span className={`asset-tag ${asset === 'gold' ? 'tag-gold' : 'tag-btc'}`}>{market.label}</span></div></div>
        <button className="icon-button more-button" aria-label="Mở phân tích thị trường" title="Mở phân tích thị trường" onClick={() => onNavigate('Phân tích thị trường')}><MoreHorizontal size={19} /></button>
      </div>
      <div className="chart-price-row"><strong>${market.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong><span className="positive-change"><ArrowUpRight size={14} /> +{market.change}%</span><span className="chart-price-period">trong 24 giờ</span></div>
      <div className="chart-controls"><div className="chart-asset-tabs"><button className={asset === 'gold' ? 'asset-tab-active' : ''} onClick={() => setAsset('gold')}>XAU/USD</button><button className={asset === 'btc' ? 'asset-tab-active' : ''} onClick={() => setAsset('btc')}>BTC/USDT</button></div><div className="range-buttons">{['1D', '1W', '1M'].map((item) => <button key={item} className={range === item ? 'range-active' : ''} onClick={() => setRange(item)}>{item}</button>)}</div></div>
      <PriceChart asset={asset} range={range} />
      <div className="chart-legend"><span><i className={`legend-dot ${asset === 'gold' ? 'legend-gold' : 'legend-blue'}`} /> {market.symbol} <b>·</b> Giá mô phỏng</span><span>NGUỒN: DỮ LIỆU MẪU</span></div>
    </article>
  )
}
