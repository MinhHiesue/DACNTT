"""Module 10: Động cơ kiểm thử lịch sử chiến lược (Backtesting Engine)."""
from typing import Dict, Any, Tuple, Optional
import numpy as np
import pandas as pd
from loguru import logger

from src.features.extractor import FeatureExtractor
from src.features.volume_filter import VolumeRegimeFilter
from src.engine.similarity_engine import SimilarityEngine
from src.engine.risk_manager import RiskManager
from src.mining.metrics import calculate_trade_metrics


class BacktestEngine:
    """
    Mô phỏng khớp lệnh từng nến M5 trên dữ liệu ngoài tập huấn luyện (Out-of-sample).
    Tính đầy đủ chi phí Spread và Slippage thực tế.
    """

    def __init__(
        self,
        initial_balance: float = 10000.0,
        spread_usd: float = 0.3,
        slippage_usd: float = 0.1,
        max_holding_bars: int = 12,
        risk_percent: float = 1.0
    ):
        self.initial_balance = initial_balance
        self.spread_usd = spread_usd
        self.slippage_usd = slippage_usd
        self.max_holding_bars = max_holding_bars
        self.risk_percent = risk_percent

        self.feature_extractor = FeatureExtractor()
        self.volume_filter = VolumeRegimeFilter()

    @staticmethod
    def split_train_test(
        df: pd.DataFrame,
        train_ratio: float = 0.7
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Tách chuỗi thời gian thành 2 phần nghiêm ngặt không chồng lấn."""
        n = len(df)
        split_idx = int(n * train_ratio)
        train_df = df.iloc[:split_idx].reset_index(drop=True)
        test_df = df.iloc[split_idx:].reset_index(drop=True)
        logger.info(
            f"Tách dữ liệu: Tập Train {len(train_df)} nến ({train_ratio*100:.0f}%), "
            f"Tập Test {len(test_df)} nến ({(1-train_ratio)*100:.0f}%)."
        )
        return train_df, test_df

    def run_backtest(
        self,
        test_df: pd.DataFrame,
        similarity_engine: SimilarityEngine,
        risk_manager: Optional[RiskManager] = None
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Duyệt qua từng nến trong tập kiểm thử (Test Set) và mô phỏng giao dịch.
        """
        if risk_manager is None:
            risk_manager = RiskManager(account_balance=self.initial_balance)

        logger.info(f"Bắt đầu chạy Backtest trên {len(test_df)} nến Out-of-sample...")

        # Áp dụng Volume Filter
        test_df_filtered = self.volume_filter.apply_to_dataframe(test_df)

        closes = test_df_filtered['close'].values
        highs = test_df_filtered['high'].values
        lows = test_df_filtered['low'].values
        timestamps = test_df_filtered['timestamp'].values
        vol_pass = test_df_filtered['volume_filter_pass'].values

        n_bars = len(test_df_filtered)
        min_start_idx = self.feature_extractor.min_buffer_bars
        max_end_idx = n_bars - self.max_holding_bars

        trades = []
        current_balance = self.initial_balance
        in_trade_until = -1 # Tránh mở lệnh chồng chéo khi lệnh trước chưa kết thúc

        for t in range(min_start_idx, max_end_idx):
            if t <= in_trade_until:
                continue

            # 1. Kiểm tra Volume Filter
            if not vol_pass[t]:
                continue

            # 2. Trích xuất Feature Vector
            window_slice = test_df_filtered.iloc[t - 49 : t + 1]
            vector = self.feature_extractor.extract_from_window(window_slice)

            # 3. So khớp với Similarity Engine
            match_res = similarity_engine.find_matches(vector)
            if match_res.decision not in ["LONG", "SHORT"]:
                continue

            # 4. Thẩm định qua Risk Manager
            setup_15 = test_df_filtered.iloc[t - 14 : t + 1]
            signal = risk_manager.evaluate_signal(
                match_res, setup_15, account_balance=current_balance
            )
            if signal.status != "APPROVED":
                continue

            # 5. Mô phỏng khớp lệnh thực tế (có Spread & Slippage)
            direction = signal.direction
            lot_size = signal.suggested_lot
            sl_price = signal.stop_loss
            tp_price = signal.take_profit

            if direction == "LONG":
                actual_entry = closes[t] + self.spread_usd + self.slippage_usd
            else:
                actual_entry = closes[t] - self.slippage_usd

            exit_price = actual_entry
            exit_reason = "TIMEOUT"
            holding_bars = self.max_holding_bars

            # Theo dõi đường đi giá trong 12 nến tiếp theo
            fwd_highs = highs[t + 1 : t + 1 + self.max_holding_bars]
            fwd_lows = lows[t + 1 : t + 1 + self.max_holding_bars]
            fwd_closes = closes[t + 1 : t + 1 + self.max_holding_bars]

            for step in range(self.max_holding_bars):
                b_high = fwd_highs[step]
                b_low = fwd_lows[step]

                if direction == "LONG":
                    hit_sl = b_low <= sl_price
                    hit_tp = b_high >= tp_price

                    if hit_sl and hit_tp:
                        exit_price = sl_price - self.slippage_usd
                        exit_reason = "STOP_LOSS"
                        holding_bars = step + 1
                        break
                    elif hit_sl:
                        exit_price = sl_price - self.slippage_usd
                        exit_reason = "STOP_LOSS"
                        holding_bars = step + 1
                        break
                    elif hit_tp:
                        exit_price = tp_price
                        exit_reason = "TAKE_PROFIT"
                        holding_bars = step + 1
                        break

                else: # SHORT
                    hit_sl = b_high >= sl_price
                    hit_tp = b_low <= tp_price

                    if hit_sl and hit_tp:
                        exit_price = sl_price + self.spread_usd + self.slippage_usd
                        exit_reason = "STOP_LOSS"
                        holding_bars = step + 1
                        break
                    elif hit_sl:
                        exit_price = sl_price + self.spread_usd + self.slippage_usd
                        exit_reason = "STOP_LOSS"
                        holding_bars = step + 1
                        break
                    elif hit_tp:
                        exit_price = tp_price
                        exit_reason = "TAKE_PROFIT"
                        holding_bars = step + 1
                        break

            # Nếu hết 12 nến mà chưa chạm TP/SL -> Đóng lệnh tại giá đóng cửa nến thứ 12
            if exit_reason == "TIMEOUT":
                if direction == "LONG":
                    exit_price = fwd_closes[-1]
                else:
                    exit_price = fwd_closes[-1] + self.spread_usd

            # Tính PnL tiền mặt: 1 lot Vàng di chuyển 1 USD = 100 USD PnL
            if direction == "LONG":
                price_diff = exit_price - actual_entry
            else:
                price_diff = actual_entry - exit_price

            net_profit = price_diff * lot_size * 100.0
            current_balance += net_profit
            in_trade_until = t + holding_bars

            trades.append({
                "entry_time": timestamps[t],
                "direction": direction,
                "entry_price": round(actual_entry, 2),
                "exit_price": round(exit_price, 2),
                "sl_price": round(sl_price, 2),
                "tp_price": round(tp_price, 2),
                "lot_size": lot_size,
                "net_profit": round(net_profit, 2),
                "exit_reason": exit_reason,
                "holding_bars": holding_bars,
                "balance_after": round(current_balance, 2)
            })

        trades_df = pd.DataFrame(trades)
        metrics = calculate_trade_metrics(trades_df, self.initial_balance)
        logger.success(
            f"Backtest hoàn tất! Tổng số lệnh: {metrics['total_trades']}, "
            f"Winrate: {metrics['winrate_pct']}%, Profit Factor: {metrics['profit_factor']}, "
            f"Max DD: {metrics['max_drawdown_pct']}%, Net Profit: ${metrics['net_profit_usd']}"
        )
        return trades_df, metrics
