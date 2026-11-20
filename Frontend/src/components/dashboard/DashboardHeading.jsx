import { useState } from 'react'
import { ArrowUpRight, Check, Gem, SlidersHorizontal } from 'lucide-react'
import { useMarketData } from '../../hooks/useMarketData.js'
import { formatSignalPrice } from '../../data/signalUtils.js'

export function DashboardHeading({ asset, setAsset }) {
  const [customOpen, setCustomOpen] = useState(false)

  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" /> THỊ TRƯỜNG THỰC TẾ BINANCE <span className="heading-time">M5 REAL-TIME</span>
          </div>
          <h1>Toàn cảnh thị trường<span>.</span></h1>
          <p className="page-subtitle">Dữ liệu nến và tín hiệu trực tiếp từ Binance Public API (100% No Mock).</p>
        </div>
        <div className="heading-actions">
          <span className="market-open"><span className="online-pulse" /> THỊ TRƯỜNG ĐANG MỞ</span>
          <button className="outline-button" onClick={() => setCustomOpen(!customOpen)} aria-expanded={customOpen}>
            <SlidersHorizontal size={15} /> Tùy chỉnh
          </button>
          {customOpen && (
            <div className="watchlist-pop">
              <div className="watchlist-pop-title">Cặp theo dõi</div>
              <button onClick={() => { setAsset('gold'); setCustomOpen(false) }}>
                <Gem size={14} /> XAU / USDT <span>Vàng Futures</span>{asset === 'gold' && <Check size={14} />}
              </button>
              <button onClick={() => { setAsset('btc'); setCustomOpen(false) }}>
                <span className="watchlist-btc">₿</span> BTC / USDT <span>Bitcoin</span>{asset === 'btc' && <Check size={14} />}
              </button>
            </div>
          )}
        </div>
      </section>
      <MarketRibbon asset={asset} setAsset={setAsset} />
    </>
  )
}

function MarketRibbon({ asset, setAsset }) {
  const { klines: xauKlines } = useMarketData('XAUUSDT', 15)
  const { klines: btcKlines } = useMarketData('BTCUSDT', 15)

  const realXauPrice = xauKlines && xauKlines.length > 0 ? Number(xauKlines[xauKlines.length - 1].close) : 0
  const realBtcPrice = btcKlines && btcKlines.length > 0 ? Number(btcKlines[btcKlines.length - 1].close) : 0

  return (
    <section className="market-ribbon" aria-label="Theo dõi thị trường">
      <button
        type="button"
        className={`ribbon-asset cursor-pointer ${asset === 'gold' ? 'ribbon-selected' : ''}`}
        onClick={() => setAsset('gold')}
      >
        <span className="asset-icon gold-icon"><Gem size={16} /></span>
        <span className="ribbon-name">VÀNG VĨNH CỬU (BINANCE)</span>
        <strong>{realXauPrice > 0 ? `$${formatSignalPrice(realXauPrice)}` : 'Đang tải...'}</strong>
        <span className="positive-change"><ArrowUpRight size={13} /> Live</span>
      </button>

      <span className="ribbon-rule" />

      <button
        type="button"
        className={`ribbon-asset cursor-pointer ${asset === 'btc' ? 'ribbon-selected' : ''}`}
        onClick={() => setAsset('btc')}
      >
        <span className="asset-icon btc-icon"><span>₿</span></span>
        <span className="ribbon-name">BITCOIN (BINANCE)</span>
        <strong>{realBtcPrice > 0 ? `$${formatSignalPrice(realBtcPrice)}` : 'Đang tải...'}</strong>
        <span className="positive-change"><ArrowUpRight size={13} /> Live</span>
      </button>

      <div className="ribbon-note">
        <span className="online-pulse" /> Dữ liệu trực tiếp <span className="note-separator">·</span> Binance Feed
      </div>
    </section>
  )
}
