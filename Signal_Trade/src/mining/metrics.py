"""Module tính toán các chỉ số thống kê hiệu năng giao dịch (Performance Metrics)."""
from typing import Dict, Any
import numpy as np
import pandas as pd


def calculate_trade_metrics(trades_df: pd.DataFrame, initial_balance: float = 10000.0) -> Dict[str, Any]:
    """
    Tính toán chi tiết các chỉ số:
    - Tỷ lệ thắng (Winrate %)
    - Hệ số lợi nhuận (Profit Factor)
    - Mức sụt giảm tối đa (Max Drawdown % & USD)
    - Tỷ số Sharpe Ratio & Sortino Ratio
    - Lợi nhuận ròng (Net Profit)
    - Tỷ lệ Lãi TB / Lỗ TB (Win/Loss Ratio)
    """
    if trades_df.empty:
        return {
            "total_trades": 0,
            "winrate_pct": 0.0,
            "profit_factor": 0.0,
            "max_drawdown_pct": 0.0,
            "max_drawdown_usd": 0.0,
            "net_profit_usd": 0.0,
            "sharpe_ratio": 0.0,
            "sortino_ratio": 0.0,
            "final_balance": initial_balance
        }

    pnl = trades_df['net_profit'].values
    equity = initial_balance + np.cumsum(pnl)

    # Tính Drawdown
    peaks = np.maximum.accumulate(equity)
    drawdowns_usd = peaks - equity
    drawdowns_pct = (drawdowns_usd / peaks) * 100.0

    max_dd_usd = float(np.max(drawdowns_usd))
    max_dd_pct = float(np.max(drawdowns_pct))

    wins = trades_df[trades_df['net_profit'] > 0]
    losses = trades_df[trades_df['net_profit'] < 0]

    total_trades = len(trades_df)
    win_trades = len(wins)
    loss_trades = len(losses)
    winrate = (win_trades / total_trades) * 100.0 if total_trades > 0 else 0.0

    gross_profit = float(wins['net_profit'].sum()) if not wins.empty else 0.0
    gross_loss = float(abs(losses['net_profit'].sum())) if not losses.empty else 0.0

    if gross_loss > 0:
        profit_factor = gross_profit / gross_loss
    else:
        profit_factor = 999.0 if gross_profit > 0 else 0.0

    avg_win = float(wins['net_profit'].mean()) if not wins.empty else 0.0
    avg_loss = float(abs(losses['net_profit'].mean())) if not losses.empty else 0.0
    win_loss_ratio = (avg_win / avg_loss) if avg_loss > 0 else 0.0

    # Sharpe và Sortino Ratio (chuẩn hóa tỷ suất sinh lời theo từng lệnh)
    returns = pnl / initial_balance
    ret_std = float(np.std(returns)) if len(returns) > 1 else 0.0
    downside_returns = returns[returns < 0]
    downside_std = float(np.std(downside_returns)) if len(downside_returns) > 1 else 0.0

    annual_factor = np.sqrt(252 * 24 * 12) # Số nến M5 trong 1 năm
    sharpe = float((np.mean(returns) / (ret_std + 1e-8)) * np.sqrt(total_trades)) if ret_std > 0 else 0.0
    sortino = float((np.mean(returns) / (downside_std + 1e-8)) * np.sqrt(total_trades)) if downside_std > 0 else 0.0

    return {
        "total_trades": total_trades,
        "win_trades": win_trades,
        "loss_trades": loss_trades,
        "winrate_pct": round(winrate, 2),
        "profit_factor": round(profit_factor, 2),
        "max_drawdown_pct": round(max_dd_pct, 2),
        "max_drawdown_usd": round(max_dd_usd, 2),
        "net_profit_usd": round(float(equity[-1] - initial_balance), 2),
        "final_balance": round(float(equity[-1]), 2),
        "sharpe_ratio": round(sharpe, 2),
        "sortino_ratio": round(sortino, 2),
        "avg_win_usd": round(avg_win, 2),
        "avg_loss_usd": round(avg_loss, 2),
        "win_loss_ratio": round(win_loss_ratio, 2)
    }
