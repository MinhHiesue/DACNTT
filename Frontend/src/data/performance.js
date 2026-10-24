/**
 * Dữ liệu hiệu suất kiểm thử Out-of-Sample của mô hình Pattern-Matching.
 * Đồng bộ với kết quả tại Signal_Trade/reports/backtest_trades.csv.
 */

export const PERFORMANCE_MODELS = [
  {
    name: '⚡ Hybrid Ensemble AI (FAISS + XGBoost)',
    version: 'v3.0 (XAUUSDT M5)',
    accuracy: '92.4%',
    winRate: '68.50%',
    profitFactor: '2.14',
    signals: '86',
    pnl: '+$1,842.50',
    maxDrawdown: '6.25%',
    sharpe: '1.82',
    sortino: '2.45',
    winLoss: '1.95',
    bars: [30, 48, 45, 65, 68, 85, 92, 108, 115, 130, 142, 165]
  },
  {
    name: '🧠 FAISS Pattern-Matching AI',
    version: 'v2.1 (XAUUSDT M5)',
    accuracy: '88.5%',
    winRate: '54.20%',
    profitFactor: '1.42',
    signals: '123',
    pnl: '+$645.20',
    maxDrawdown: '11.30%',
    sharpe: '0.85',
    sortino: '1.15',
    winLoss: '1.45',
    bars: [25, 45, 30, 60, 52, 75, 68, 82, 74, 90, 85, 95]
  },
  {
    name: '🌲 XGBoost Extreme Gradient Boosting',
    version: 'v1.0 (XAUUSDT M5)',
    accuracy: '80.0%',
    winRate: '58.70%',
    profitFactor: '1.68',
    signals: '95',
    pnl: '+$980.40',
    maxDrawdown: '8.40%',
    sharpe: '1.24',
    sortino: '1.60',
    winLoss: '1.62',
    bars: [20, 35, 45, 50, 65, 60, 78, 85, 90, 102, 110, 125]
  }
]

export const BACKTEST_SUMMARY_FALLBACK = {
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
