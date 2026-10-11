"""Module 4 & 5: Động cơ quản trị rủi ro & Định dạng lệnh (Risk Management Engine)."""
from datetime import datetime
from typing import Optional, Union
import numpy as np
import pandas as pd
from loguru import logger

from src.core.schemas import MatchResult, TradeSignal
from src.core.config_loader import RiskManagerConfig


class RiskManager:
    """
    Quản trị rủi ro và phê duyệt lệnh:
    1. Xác định Entry tại Close_t.
    2. Xác định Stop Loss theo Swing Low/High của 15 nến setup kèm buffer 0.5 USD.
    3. Xác định Take Profit cố định (1.5x SL) hoặc Dynamic Memory TP.
    4. Kiểm duyệt tỷ lệ R:R tối thiểu >= 1.5.
    5. Kiểm duyệt khoảng cách SL hợp lệ (min_sl <= delta_sl <= max_sl).
    6. Tính toán kích thước vị thế (Lot size) theo % rủi ro tài khoản.
    """

    def __init__(
        self,
        config: Optional[RiskManagerConfig] = None,
        account_balance: float = 10000.0,
        digits: int = 2
    ):
        if config is None:
            config = RiskManagerConfig()

        self.swing_window = config.swing_window
        self.buffer_usd = config.buffer_usd
        self.min_rr_ratio = config.min_rr_ratio
        self.risk_percent = config.risk_percent
        self.min_sl_usd = config.min_sl_usd
        self.max_sl_usd = config.max_sl_usd
        self.default_balance = account_balance
        self.digits = digits

    def evaluate_signal(
        self,
        match_result: MatchResult,
        setup_bars: pd.DataFrame,
        symbol: str = "XAUUSD",
        account_balance: Optional[float] = None,
        memory_bank_df: Optional[pd.DataFrame] = None
    ) -> TradeSignal:
        """
        Thẩm định quyết định từ Similarity Engine và tạo đối tượng TradeSignal.
        """
        last_bar = setup_bars.iloc[-1]
        timestamp = last_bar['timestamp'] if 'timestamp' in last_bar else datetime.utcnow()
        if isinstance(timestamp, pd.Timestamp):
            timestamp = timestamp.to_pydatetime()
        entry_price = round(float(last_bar['close']), self.digits)

        # 1. Nếu Similarity Engine không có tín hiệu hoặc xung đột
        if match_result.decision not in ["LONG", "SHORT"]:
            return TradeSignal(
                timestamp=timestamp,
                symbol=symbol,
                direction="NONE",
                entry_price=entry_price,
                stop_loss=0.0,
                take_profit=0.0,
                delta_sl=0.0,
                delta_tp=0.0,
                rr_ratio=0.0,
                suggested_lot=0.0,
                confidence=match_result.confidence,
                matched_count=match_result.total_matches,
                status="REJECTED",
                reject_reason=f"NO_CLEAR_SIGNAL_{match_result.decision}"
            )

        # 2. Kiểm tra dữ liệu nến setup
        if len(setup_bars) < self.swing_window:
            return TradeSignal(
                timestamp=timestamp,
                symbol=symbol,
                direction=match_result.decision,
                entry_price=entry_price,
                stop_loss=0.0,
                take_profit=0.0,
                delta_sl=0.0,
                delta_tp=0.0,
                rr_ratio=0.0,
                suggested_lot=0.0,
                confidence=match_result.confidence,
                matched_count=match_result.total_matches,
                status="REJECTED",
                reject_reason="INSUFFICIENT_SETUP_BARS"
            )

        window_df = setup_bars.iloc[-self.swing_window:]
        direction = match_result.decision

        # 3. Tính toán Stop Loss dựa trên Swing Low / High
        if direction == "LONG":
            swing_low = float(window_df['low'].min())
            sl_price = round(swing_low - self.buffer_usd, self.digits)
            delta_sl = round(entry_price - sl_price, self.digits)
        else: # SHORT
            swing_high = float(window_df['high'].max())
            sl_price = round(swing_high + self.buffer_usd, self.digits)
            delta_sl = round(sl_price - entry_price, self.digits)

        # 4. Kiểm tra độ rộng của Stop Loss
        if delta_sl < self.min_sl_usd:
            return TradeSignal(
                timestamp=timestamp,
                symbol=symbol,
                direction=direction,
                entry_price=entry_price,
                stop_loss=sl_price,
                take_profit=0.0,
                delta_sl=delta_sl,
                delta_tp=0.0,
                rr_ratio=0.0,
                suggested_lot=0.0,
                confidence=match_result.confidence,
                matched_count=match_result.total_matches,
                status="REJECTED",
                reject_reason=f"SL_TOO_TIGHT ({delta_sl:.2f} < {self.min_sl_usd:.2f})"
            )

        if delta_sl > self.max_sl_usd:
            return TradeSignal(
                timestamp=timestamp,
                symbol=symbol,
                direction=direction,
                entry_price=entry_price,
                stop_loss=sl_price,
                take_profit=0.0,
                delta_sl=delta_sl,
                delta_tp=0.0,
                rr_ratio=0.0,
                suggested_lot=0.0,
                confidence=match_result.confidence,
                matched_count=match_result.total_matches,
                status="REJECTED",
                reject_reason=f"SL_TOO_WIDE ({delta_sl:.2f} > {self.max_sl_usd:.2f})"
            )

        # 5. Tính toán Take Profit
        # Mặc định theo Fixed 1.5x SL
        target_delta_tp = round(delta_sl * self.min_rr_ratio, self.digits)

        # Nếu có memory bank và danh sách mẫu hình tương đồng, thử áp dụng Dynamic TP
        if memory_bank_df is not None and match_result.matched_indices:
            valid_indices = [idx for idx in match_result.matched_indices if idx < len(memory_bank_df)]
            if valid_indices:
                matched_sub = memory_bank_df.iloc[valid_indices]
                avg_move = float(matched_sub['max_favorable_move'].mean())
                if avg_move >= target_delta_tp:
                    target_delta_tp = round(avg_move, self.digits)

        if direction == "LONG":
            tp_price = round(entry_price + target_delta_tp, self.digits)
            delta_tp = round(tp_price - entry_price, self.digits)
        else: # SHORT
            tp_price = round(entry_price - target_delta_tp, self.digits)
            delta_tp = round(entry_price - tp_price, self.digits)

        # 6. Kiểm tra tỷ lệ R:R
        rr_ratio = round(delta_tp / (delta_sl + 1e-6), 2)
        if rr_ratio < self.min_rr_ratio:
            return TradeSignal(
                timestamp=timestamp,
                symbol=symbol,
                direction=direction,
                entry_price=entry_price,
                stop_loss=sl_price,
                take_profit=tp_price,
                delta_sl=delta_sl,
                delta_tp=delta_tp,
                rr_ratio=rr_ratio,
                suggested_lot=0.0,
                confidence=match_result.confidence,
                matched_count=match_result.total_matches,
                status="REJECTED",
                reject_reason=f"REJECTED_RR_BELOW_1.5 ({rr_ratio:.2f} < {self.min_rr_ratio:.2f})"
            )

        # 7. Tính Lot size theo 1.0% rủi ro tài khoản
        # Với XAU/USD (1 lot = 100 oz), mỗi biến động 1.0 USD giá vàng = 100 USD PnL trên 1 lot
        curr_balance = account_balance if account_balance is not None else self.default_balance
        risk_amount_usd = curr_balance * (self.risk_percent / 100.0)
        dollar_risk_per_lot = delta_sl * 100.0
        raw_lot = risk_amount_usd / (dollar_risk_per_lot + 1e-6)
        # Giới hạn an toàn từ 0.01 đến 10.0 lot
        suggested_lot = round(float(np.clip(raw_lot, 0.01, 10.0)), 2)

        return TradeSignal(
            timestamp=timestamp,
            symbol=symbol,
            direction=direction,
            entry_price=entry_price,
            stop_loss=sl_price,
            take_profit=tp_price,
            delta_sl=delta_sl,
            delta_tp=delta_tp,
            rr_ratio=rr_ratio,
            suggested_lot=suggested_lot,
            confidence=match_result.confidence,
            matched_count=match_result.total_matches,
            status="APPROVED",
            reject_reason=None
        )
