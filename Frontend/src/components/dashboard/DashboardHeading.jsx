import { useState } from 'react'
import { ArrowUpRight, Check, Gem, SlidersHorizontal } from 'lucide-react'

export function DashboardHeading({ asset, setAsset }) {
  const [customOpen, setCustomOpen] = useState(false)

  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> THỨ NĂM, 01 THÁNG 10 2026 <span className="heading-time">10:44 ICT</span></div>
          <h1>Toàn cảnh thị trường<span>.</span></h1>
          <p className="page-subtitle">Tín hiệu thông minh. Quyết định sáng suốt.</p>
        </div>
        <div className="heading-actions">
          <span className="market-open"><span className="online-pulse" /> THỊ TRƯỜNG ĐANG MỞ</span>
          <button className="outline-button" onClick={() => setCustomOpen(!customOpen)} aria-expanded={customOpen}><SlidersHorizontal size={15} /> Tùy chỉnh</button>
          {customOpen && <div className="watchlist-pop">
            <div className="watchlist-pop-title">Cặp theo dõi</div>
            <button onClick={() => setAsset('gold')}><Gem size={14} /> XAU / USDT <span>Vàng Futures</span>{asset === 'gold' && <Check size={14} />}</button>
            <button onClick={() => setAsset('btc')}><span className="watchlist-btc">₿</span> BTC / USDT <span>Bitcoin</span>{asset === 'btc' && <Check size={14} />}</button>
          </div>}
        </div>
      </section>
      <MarketRibbon asset={asset} setAsset={setAsset} />
    </>
  )
}

function MarketRibbon({ asset, setAsset }) {
  return (
    <section className="market-ribbon" aria-label="Theo dõi thị trường">
      <button className={`ribbon-asset ${asset === 'gold' ? 'ribbon-selected' : ''}`} onClick={() => setAsset('gold')}>
        <span className="asset-icon gold-icon"><Gem size={16} /></span><span className="ribbon-name">VÀNG VĨNH CỬU (BINANCE)</span><strong>$4,005.50</strong><span className="positive-change"><ArrowUpRight size={13} /> +0.85%</span>
      </button>
      <span className="ribbon-rule" />
      <button className={`ribbon-asset ${asset === 'btc' ? 'ribbon-selected' : ''}`} onClick={() => setAsset('btc')}>
        <span className="asset-icon btc-icon"><span>₿</span></span><span className="ribbon-name">BITCOIN</span><strong>$67,482.35</strong><span className="positive-change"><ArrowUpRight size={13} /> +1.34%</span>
      </button>
      <div className="ribbon-note"><span className="online-pulse" /> Dữ liệu trực tiếp <span className="note-separator">·</span> Binance Futures Feed</div>
    </section>
  )
}
