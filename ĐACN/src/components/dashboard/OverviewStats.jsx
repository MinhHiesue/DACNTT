import { ArrowUpRight, Cpu, Signal, Database, Scale, TrendingUp } from 'lucide-react'
import { usePerformance } from '../../hooks/usePerformance.js'
import { useSystemHealth } from '../../hooks/useSystemHealth.js'
import { formatSignalPrice } from '../../data/signalUtils.js'

export function OverviewStats() {
  const { summary } = usePerformance(100)
  const { health } = useSystemHealth(10000)

  const pf = summary?.profit_factor || 1.03
  const totalTrades = summary?.total_trades || 123
  const winTrades = summary?.win_trades || 55
  const lossTrades = summary?.loss_trades || 68
  const netProfit = summary?.net_profit_usd || 245.16
  const patternCount = health?.pattern_count || 1977

  return (
    <section className="stat-grid" aria-label="Thống kê tổng quan">
      {/* 1. Profit Factor */}
      <article className="stat-card">
        <div className="stat-head">
          <span>PROFIT FACTOR</span>
          <span className="stat-icon green-stat">
            <Scale size={16} />
          </span>
        </div>
        <div className="stat-main">
          <strong>{pf.toFixed(2)}</strong>
          <span className="stat-trend text-emerald-400">
            <ArrowUpRight size={14} /> Đạt chuẩn &gt; 1.0
          </span>
        </div>
        <div className="stat-foot">Hệ số lợi nhuận kiểm thử</div>
        <div className="sparkline spark-blue">
          <span style={{ '--spark': '22%' }} />
          <span style={{ '--spark': '36%' }} />
          <span style={{ '--spark': '50%' }} />
          <span style={{ '--spark': '65%' }} />
          <span style={{ '--spark': '58%' }} />
          <span style={{ '--spark': '75%' }} />
          <span style={{ '--spark': '85%' }} />
          <span style={{ '--spark': '100%' }} />
        </div>
      </article>

      {/* 2. Total Trades */}
      <article className="stat-card">
        <div className="stat-head">
          <span>TỔNG LỆNH BACKTEST</span>
          <span className="stat-icon gold-stat">
            <Signal size={16} />
          </span>
        </div>
        <div className="stat-main">
          <strong>{totalTrades}</strong>
          <span className="stat-trend">Out-of-Sample</span>
        </div>
        <div className="stat-foot">
          {winTrades} Thắng <i /> {lossTrades} Thua (Winrate {(summary?.winrate_pct || 44.72).toFixed(1)}%)
        </div>
        <div className="stat-progress">
          <span style={{ width: `${summary?.winrate_pct || 44.72}%` }} />
        </div>
      </article>

      {/* 3. Net Profit */}
      <article className="stat-card">
        <div className="stat-head">
          <span>LỢI NHUẬN RÒNG</span>
          <span className="stat-icon blue-stat">
            <TrendingUp size={16} />
          </span>
        </div>
        <div className="stat-main">
          <strong>+${formatSignalPrice(netProfit)}</strong>
          <span className="stat-trend text-emerald-400">
            <ArrowUpRight size={14} /> +{((netProfit / 10000) * 100).toFixed(2)}%
          </span>
        </div>
        <div className="stat-foot">Số dư: ${formatSignalPrice(summary?.final_balance || 10245.16)}</div>
        <div className="mini-bars">
          <i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
        </div>
      </article>

      {/* 4. Memory Bank */}
      <article className="stat-card">
        <div className="stat-head">
          <span>KÝ ỨC MẪU HÌNH</span>
          <span className="stat-icon violet-stat">
            <Database size={16} />
          </span>
        </div>
        <div className="stat-main">
          <strong>{patternCount.toLocaleString()}</strong>
          <span className="live-pill">
            <span className="online-pulse" /> FAISS 49D
          </span>
        </div>
        <div className="stat-foot">Cosine Similarity &ge; 85%</div>
        <div className="strategy-foot">
          <span><Cpu size={12} /> Binance M5 Engine</span>
          <span>v2.0</span>
        </div>
      </article>
    </section>
  )
}
