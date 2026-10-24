import {
  TrendingUp,
  Percent,
  Activity,
  ShieldAlert,
  Wallet,
  Scale,
  Award,
  BarChart3
} from 'lucide-react'
import { formatSignalPrice } from '../../data/signalUtils.js'

export function QuantitativeKPIGrid({ summary }) {
  const data = summary || {
    total_trades: 123,
    win_trades: 55,
    loss_trades: 68,
    winrate_pct: 44.72,
    profit_factor: 1.03,
    max_drawdown_pct: 14.71,
    max_drawdown_usd: 1681.83,
    net_profit_usd: 245.16,
    final_balance: 10245.16,
    sharpe_ratio: 0.14,
    sortino_ratio: 0.42,
    win_loss_ratio: 1.27
  }

  const isProfitable = data.net_profit_usd >= 0

  return (
    <section className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6" aria-label="Lưới chỉ số định lượng">
      {/* 1. Final Balance */}
      <article className="p-4 bg-[#161B22] border border-[#21262D] rounded-2xl relative overflow-hidden group hover:border-[#30363D] transition-all">
        <div className="flex items-center justify-between text-xs text-[#8B949E] mb-1.5">
          <span className="font-semibold uppercase tracking-wider">SỐ DƯ CUỐI KỲ</span>
          <Wallet size={15} className="text-blue-400" />
        </div>
        <strong className="text-xl font-bold font-mono text-white block">
          ${formatSignalPrice(data.final_balance)}
        </strong>
        <small className="text-[11px] text-[#8B949E] mt-1 block">
          Vốn ban đầu: $10,000.00
        </small>
      </article>

      {/* 2. Net Profit */}
      <article className="p-4 bg-[#161B22] border border-[#21262D] rounded-2xl relative overflow-hidden group hover:border-[#30363D] transition-all">
        <div className="flex items-center justify-between text-xs text-[#8B949E] mb-1.5">
          <span className="font-semibold uppercase tracking-wider">LỢI NHUẬN RÒNG</span>
          <TrendingUp size={15} className={isProfitable ? 'text-[#089981]' : 'text-[#F23645]'} />
        </div>
        <strong
          className={`text-xl font-bold font-mono block ${
            isProfitable ? 'text-[#089981]' : 'text-[#F23645]'
          }`}
        >
          {isProfitable ? '+' : ''}${formatSignalPrice(data.net_profit_usd)}
        </strong>
        <small className="text-[11px] text-[#8B949E] mt-1 block">
          Tỷ suất sinh lời: {((data.net_profit_usd / 10000) * 100).toFixed(2)}%
        </small>
      </article>

      {/* 3. Total Trades */}
      <article className="p-4 bg-[#161B22] border border-[#21262D] rounded-2xl relative overflow-hidden group hover:border-[#30363D] transition-all">
        <div className="flex items-center justify-between text-xs text-[#8B949E] mb-1.5">
          <span className="font-semibold uppercase tracking-wider">TỔNG SỐ LỆNH</span>
          <BarChart3 size={15} className="text-cyan-400" />
        </div>
        <strong className="text-xl font-bold font-mono text-white block">
          {data.total_trades} lệnh
        </strong>
        <small className="text-[11px] text-[#8B949E] mt-1 block">
          <span className="text-[#089981] font-semibold">{data.win_trades} Thắng</span> /{' '}
          <span className="text-[#F23645] font-semibold">{data.loss_trades} Thua</span>
        </small>
      </article>

      {/* 4. Winrate */}
      <article className="p-4 bg-[#161B22] border border-[#21262D] rounded-2xl relative overflow-hidden group hover:border-[#30363D] transition-all">
        <div className="flex items-center justify-between text-xs text-[#8B949E] mb-1.5">
          <span className="font-semibold uppercase tracking-wider">TỶ LỆ THẮNG</span>
          <Percent size={15} className="text-yellow-400" />
        </div>
        <strong className="text-xl font-bold font-mono text-white block">
          {data.winrate_pct.toFixed(1)}%
        </strong>
        <small className="text-[11px] text-[#8B949E] mt-1 block">
          R:R 1.50+ bù đắp Winrate
        </small>
      </article>

      {/* 5. Profit Factor */}
      <article className="p-4 bg-[#161B22] border border-[#21262D] rounded-2xl relative overflow-hidden group hover:border-[#30363D] transition-all">
        <div className="flex items-center justify-between text-xs text-[#8B949E] mb-1.5">
          <span className="font-semibold uppercase tracking-wider">PROFIT FACTOR</span>
          <Scale size={15} className="text-emerald-400" />
        </div>
        <strong className="text-xl font-bold font-mono text-emerald-400 block">
          {data.profit_factor.toFixed(2)}
        </strong>
        <small className="text-[11px] text-[#8B949E] mt-1 block">
          Tổng Lãi / Tổng Lỗ &gt; 1.0
        </small>
      </article>

      {/* 6. Max Drawdown */}
      <article className="p-4 bg-[#161B22] border border-[#21262D] rounded-2xl relative overflow-hidden group hover:border-[#30363D] transition-all">
        <div className="flex items-center justify-between text-xs text-[#8B949E] mb-1.5">
          <span className="font-semibold uppercase tracking-wider">MAX DRAWDOWN</span>
          <ShieldAlert size={15} className="text-rose-400" />
        </div>
        <strong className="text-xl font-bold font-mono text-rose-400 block">
          {data.max_drawdown_pct.toFixed(2)}%
        </strong>
        <small className="text-[11px] text-[#8B949E] mt-1 block">
          -${formatSignalPrice(data.max_drawdown_usd)} USD
        </small>
      </article>

      {/* 7. Sharpe & Sortino */}
      <article className="p-4 bg-[#161B22] border border-[#21262D] rounded-2xl relative overflow-hidden group hover:border-[#30363D] transition-all">
        <div className="flex items-center justify-between text-xs text-[#8B949E] mb-1.5">
          <span className="font-semibold uppercase tracking-wider">SHARPE / SORTINO</span>
          <Award size={15} className="text-purple-400" />
        </div>
        <strong className="text-xl font-bold font-mono text-white block">
          {data.sharpe_ratio.toFixed(2)} / {data.sortino_ratio.toFixed(2)}
        </strong>
        <small className="text-[11px] text-[#8B949E] mt-1 block">
          Hệ số bù trừ rủi ro thị trường
        </small>
      </article>

      {/* 8. Win/Loss Ratio */}
      <article className="p-4 bg-[#161B22] border border-[#21262D] rounded-2xl relative overflow-hidden group hover:border-[#30363D] transition-all">
        <div className="flex items-center justify-between text-xs text-[#8B949E] mb-1.5">
          <span className="font-semibold uppercase tracking-wider">WIN/LOSS RATIO</span>
          <Activity size={15} className="text-amber-400" />
        </div>
        <strong className="text-xl font-bold font-mono text-white block">
          {data.win_loss_ratio.toFixed(2)}
        </strong>
        <small className="text-[11px] text-[#8B949E] mt-1 block">
          Lãi TB / Lỗ TB mỗi lệnh
        </small>
      </article>
    </section>
  )
}
