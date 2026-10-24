import { RefreshCw, ShieldCheck, Database, Layers } from 'lucide-react'
import { QuantitativeKPIGrid } from '../components/performance/QuantitativeKPIGrid.jsx'
import { InteractiveEquityCurve } from '../components/performance/InteractiveEquityCurve.jsx'
import { BacktestTradeLedger } from '../components/performance/BacktestTradeLedger.jsx'
import { usePerformance } from '../hooks/usePerformance.js'
import { BACKTEST_SUMMARY_FALLBACK } from '../data/performance.js'

export function PerformancePage() {
  const { summary, trades, loading, refresh } = usePerformance(200)

  const activeSummary = summary || BACKTEST_SUMMARY_FALLBACK

  return (
    <div className="utility-page">
      {/* Page Heading */}
      <section className="signals-page-heading mb-6">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" /> QUANTITATIVE PERFORMANCE
            <span className="heading-time">OUT-OF-SAMPLE TEST</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Báo cáo hiệu suất kiểm thử lịch sử<span>.</span>
          </h1>
          <p className="page-subtitle text-xs text-[#8B949E] mt-1">
            Đánh giá định lượng thuật toán FAISS Pattern-Matching trên tập dữ liệu kiểm thử độc lập (123 giao dịch).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#161B22] border border-[#21262D] text-xs font-semibold text-cyan-300">
            <Database size={13} className="text-blue-400" />
            <span>XAU/USDT · Binance Futures M5</span>
          </div>

          <button
            onClick={() => refresh()}
            className="p-2 bg-[#161B22] hover:bg-[#21262D] text-[#8B949E] hover:text-white rounded-xl border border-[#21262D] transition-colors"
            title="Làm mới báo cáo"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </section>

      {/* Quantitative KPI Grid */}
      <QuantitativeKPIGrid summary={activeSummary} />

      {/* Interactive Equity Curve */}
      <InteractiveEquityCurve trades={trades} initialBalance={10000} height={360} />

      {/* Backtest Trades Ledger Table */}
      <BacktestTradeLedger trades={trades} />

      <footer className="page-footer mt-8">
        <span>© 2026 NORTHSTAR QUANTITATIVE TRADING INTELLIGENCE</span>
        <span>
          <ShieldCheck size={12} /> DỮ LIỆU BACKTEST OUT-OF-SAMPLE THỰC TẾ · KHÔNG LÀM QUÁ DỮ LIỆU (OVERFITTING)
        </span>
        <span>FAISS PATTERN AI v2.0</span>
      </footer>
    </div>
  )
}
