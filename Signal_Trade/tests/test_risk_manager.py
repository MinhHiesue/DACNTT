"""Unit tests cho Module 4 & 5: RiskManager (BTCUSDT)."""
from datetime import datetime, timezone
import pandas as pd
import pytest

from src.engine.risk_manager import RiskManager
from src.core.schemas import MatchResult, TradeSignal
from src.core.config_loader import RiskManagerConfig


@pytest.fixture
def sample_setup_bars():
    """Tạo 15 nến setup M5 mẫu cho BTCUSDT."""
    now = datetime(2024, 1, 1, 12, 0, tzinfo=timezone.utc)
    bars = []
    base_price = 65000.0

    for i in range(15):
        # Swing Low sẽ là 64700.0 tại nến 5
        # Swing High sẽ là 65400.0 tại nến 10
        low_val = 64700.0 if i == 5 else (base_price - 100.0 + (i * 10.0))
        high_val = 65400.0 if i == 10 else (base_price + 100.0 + (i * 10.0))
        close_val = base_price + 100.0 # 65100.0
        bars.append({
            'timestamp': now + pd.Timedelta(minutes=5 * i),
            'open': base_price,
            'high': high_val,
            'low': low_val,
            'close': close_val,
            'volume': 50.0
        })
    return pd.DataFrame(bars)


def test_long_signal_approval(sample_setup_bars):
    """Kiểm tra lệnh LONG: SL ở Swing Low - 20, TP đạt chuẩn R:R 1.5, status APPROVED."""
    match = MatchResult(
        decision="LONG",
        confidence=0.88,
        total_matches=15,
        long_matches=14,
        short_matches=1,
        avg_similarity=0.89
    )

    manager = RiskManager(account_balance=10000.0)
    signal = manager.evaluate_signal(match, sample_setup_bars, symbol="BTCUSDT")

    assert signal.status == "APPROVED"
    assert signal.direction == "LONG"
    assert signal.entry_price == 65100.0
    # Swing low là 64700.0 -> SL = 64700.0 - 20.0 = 64680.0
    assert signal.stop_loss == 64680.0
    # Delta SL = 65100.0 - 64680.0 = 420.0 USD
    assert signal.delta_sl == 420.0
    # TP = 65100.0 + 1.5 * 420.0 = 65730.0
    assert signal.take_profit == 65730.0
    assert signal.rr_ratio == 1.5


def test_short_signal_approval(sample_setup_bars):
    """Kiểm tra lệnh SHORT: SL ở Swing High + 20, TP đạt chuẩn R:R 1.5, status APPROVED."""
    match = MatchResult(
        decision="SHORT",
        confidence=0.85,
        total_matches=12,
        long_matches=1,
        short_matches=11,
        avg_similarity=0.87
    )

    manager = RiskManager(account_balance=10000.0)
    signal = manager.evaluate_signal(match, sample_setup_bars, symbol="BTCUSDT")

    assert signal.status == "APPROVED"
    assert signal.direction == "SHORT"
    assert signal.entry_price == 65100.0
    # Swing high là 65400.0 -> SL = 65400.0 + 20.0 = 65420.0
    assert signal.stop_loss == 65420.0
    # Delta SL = 65420.0 - 65100.0 = 320.0 USD
    assert signal.delta_sl == 320.0
    # TP = 65100.0 - 1.5 * 320.0 = 64620.0
    assert signal.take_profit == 64620.0
    assert signal.rr_ratio == 1.5


def test_sl_too_tight_rejected(sample_setup_bars):
    """Kiểm tra từ chối khi Delta SL quá hẹp (< min_sl_usd = 50.0 USD)."""
    # Điều chỉnh giá thấp nhất chỉ cách Entry 10 USD
    bars = sample_setup_bars.copy()
    bars['low'] = 65090.0 # Swing low 65090.0 - 20.0 = 65070.0 -> Delta SL = 30.0 USD < 50.0

    match = MatchResult(
        decision="LONG",
        confidence=0.90,
        total_matches=20
    )

    manager = RiskManager()
    signal = manager.evaluate_signal(match, bars, symbol="BTCUSDT")
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
    signal = manager.evaluate_signal(match, sample_setup_bars, symbol="BTCUSDT")
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

    # Giả lập Memory bank có max_favorable_move trung bình là 800.0 USD (> 1.5 * 420.0 = 630.0)
    memory_df = pd.DataFrame({
        'max_favorable_move': [750.0, 850.0] # Trung bình 800.0 USD
    })

    manager = RiskManager()
    signal = manager.evaluate_signal(match, sample_setup_bars, symbol="BTCUSDT", memory_bank_df=memory_df)

    assert signal.status == "APPROVED"
    assert signal.delta_tp == 800.0
    assert signal.take_profit == 65100.0 + 800.0 # 65900.0
    assert signal.rr_ratio == round(800.0 / 420.0, 2) # ~ 1.90
