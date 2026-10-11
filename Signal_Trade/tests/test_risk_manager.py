"""Unit tests cho Module 4 & 5: RiskManager."""
from datetime import datetime, timezone
import pandas as pd
import pytest

from src.engine.risk_manager import RiskManager
from src.core.schemas import MatchResult, TradeSignal
from src.core.config_loader import RiskManagerConfig


@pytest.fixture
def sample_setup_bars():
    """Tạo 15 nến setup M5 mẫu."""
    now = datetime(2024, 1, 1, 12, 0, tzinfo=timezone.utc)
    bars = []
    base_price = 2650.0

    for i in range(15):
        # Nến chạy từ 2648.0 đến 2653.0
        # Swing Low sẽ là 2647.0 tại nến 5
        # Swing High sẽ là 2654.0 tại nến 10
        low_val = 2647.0 if i == 5 else (base_price - 2.0 + (i * 0.1))
        high_val = 2654.0 if i == 10 else (base_price + 2.0 + (i * 0.1))
        close_val = base_price + 1.0 # 2651.0
        bars.append({
            'timestamp': now + pd.Timedelta(minutes=5 * i),
            'open': base_price,
            'high': high_val,
            'low': low_val,
            'close': close_val,
            'volume': 500.0
        })
    return pd.DataFrame(bars)


def test_long_signal_approval(sample_setup_bars):
    """Kiểm tra lệnh LONG: SL ở Swing Low - 0.5, TP đạt chuẩn R:R 1.5, status APPROVED."""
    match = MatchResult(
        decision="LONG",
        confidence=0.88,
        total_matches=15,
        long_matches=14,
        short_matches=1,
        avg_similarity=0.89
    )

    manager = RiskManager(account_balance=10000.0)
    signal = manager.evaluate_signal(match, sample_setup_bars)

    assert signal.status == "APPROVED"
    assert signal.direction == "LONG"
    assert signal.entry_price == 2651.0
    # Swing low là 2647.0 -> SL = 2647.0 - 0.5 = 2646.5
    assert signal.stop_loss == 2646.5
    # Delta SL = 2651.0 - 2646.5 = 4.5 USD
    assert signal.delta_sl == 4.5
    # TP = 2651.0 + 1.5 * 4.5 = 2657.75
    assert signal.take_profit == 2657.75
    assert signal.rr_ratio == 1.5
    # Lot: Risk 1% của 10,000 = 100 USD. Delta SL 4.5 -> 100 / (4.5 * 100) = 0.22 Lot
    assert signal.suggested_lot == 0.22


def test_short_signal_approval(sample_setup_bars):
    """Kiểm tra lệnh SHORT: SL ở Swing High + 0.5, TP đạt chuẩn R:R 1.5, status APPROVED."""
    match = MatchResult(
        decision="SHORT",
        confidence=0.85,
        total_matches=12,
        long_matches=1,
        short_matches=11,
        avg_similarity=0.87
    )

    manager = RiskManager(account_balance=10000.0)
    signal = manager.evaluate_signal(match, sample_setup_bars)

    assert signal.status == "APPROVED"
    assert signal.direction == "SHORT"
    assert signal.entry_price == 2651.0
    # Swing high là 2654.0 -> SL = 2654.0 + 0.5 = 2654.5
    assert signal.stop_loss == 2654.5
    # Delta SL = 2654.5 - 2651.0 = 3.5 USD
    assert signal.delta_sl == 3.5
    # TP = 2651.0 - 1.5 * 3.5 = 2645.75
    assert signal.take_profit == 2645.75
    assert signal.rr_ratio == 1.5
    # Lot: 100 / (3.5 * 100) = 0.29 Lot
    assert signal.suggested_lot == 0.29


def test_sl_too_tight_rejected(sample_setup_bars):
    """Kiểm tra từ chối khi Delta SL quá hẹp (< min_sl_usd = 1.0 USD)."""
    # Điều chỉnh giá thấp nhất chỉ cách Entry 0.2 USD
    bars = sample_setup_bars.copy()
    bars['low'] = 2650.8 # Swing low 2650.8 - 0.5 = 2650.3 -> Delta SL = 0.7 USD < 1.0

    match = MatchResult(
        decision="LONG",
        confidence=0.90,
        total_matches=20
    )

    manager = RiskManager()
    signal = manager.evaluate_signal(match, bars)
    assert signal.status == "REJECTED"
    assert "SL_TOO_TIGHT" in signal.reject_reason


def test_no_signal_rejected(sample_setup_bars):
    """Kiểm tra khi Similarity Engine không có tín hiệu (NO_SIGNAL)."""
    match = MatchResult(
        decision="NO_SIGNAL",
        confidence=0.50,
        total_matches=3
    )

    manager = RiskManager()
    signal = manager.evaluate_signal(match, sample_setup_bars)
    assert signal.status == "REJECTED"
    assert "NO_CLEAR_SIGNAL" in signal.reject_reason


def test_dynamic_tp_from_memory_bank(sample_setup_bars):
    """Kiểm tra Take Profit mở rộng linh hoạt theo dữ liệu quá khứ của Memory Bank."""
    match = MatchResult(
        decision="LONG",
        confidence=0.85,
        total_matches=10,
        matched_indices=[0, 1]
    )

    # Giả lập Memory bank có max_favorable_move trung bình là 10.0 USD (> 1.5 * 4.5 = 6.75)
    memory_df = pd.DataFrame({
        'max_favorable_move': [9.0, 11.0] # Trung bình 10.0 USD
    })

    manager = RiskManager()
    signal = manager.evaluate_signal(match, sample_setup_bars, memory_bank_df=memory_df)

    assert signal.status == "APPROVED"
    assert signal.delta_tp == 10.0
    assert signal.take_profit == 2651.0 + 10.0 # 2661.0
    assert signal.rr_ratio == round(10.0 / 4.5, 2) # ~ 2.22
