/**
 * Dữ liệu hiệu suất kiểm thử Out-of-Sample của mô hình Pattern-Matching.
 * Đồng bộ với kết quả tại Signal_Trade/reports/backtest_trades.csv.
 */

export const PERFORMANCE_MODELS = [
  {
    name: 'FAISS Pattern-Matching AI (M5)',
    version: 'v2.0 (BTC/USDT)',
    accuracy: '88.5%',
    winRate: '44.72%',
    profitFactor: '1.03',
    signals: '123',
    pnl: '+$245.16',
    maxDrawdown: '14.71%',
    sharpe: '0.14',
    sortino: '0.42',
    winLoss: '1.27',
    bars: [25, 45, 30, 60, 52, 75, 68, 82, 74, 90, 85, 95]
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
