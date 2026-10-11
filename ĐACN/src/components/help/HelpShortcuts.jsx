import { ArrowRight, Bot, CandlestickChart, Signal } from 'lucide-react'

export function HelpShortcuts({ onNavigate }) {
  return (
    <aside className="panel help-shortcuts">
      <div className="panel-kicker">ĐI ĐẾN</div>
      <h2>Đi nhanh đến khu vực</h2>
      <button onClick={() => onNavigate('Phân tích thị trường')}><CandlestickChart size={16} /> Phân tích thị trường <ArrowRight size={14} /></button>
      <button onClick={() => onNavigate('Tín hiệu AI')}><Signal size={16} /> Tín hiệu AI <ArrowRight size={14} /></button>
      <button onClick={() => onNavigate('Telegram Bot')}><Bot size={16} /> Telegram Bot <ArrowRight size={14} /></button>
    </aside>
  )
}
