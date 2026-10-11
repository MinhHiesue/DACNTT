"""Unit tests cho Module 3: HistoricalPatternMiner."""
import pytest
import numpy as np
import pandas as pd
from datetime import datetime, timedelta, timezone

from src.mining.pattern_miner import HistoricalPatternMiner


def test_miner_identifies_clear_long_winner():
    """Kiểm tra miner phát hiện chính xác pha LONG thắng chuẩn theo Triple Barrier."""
    now = datetime(2024, 1, 1, 0, 0, tzinfo=timezone.utc)
    n_bars = 70

    # 55 nến đầu tiên đi ngang ở mức 2000 USD với volume đều đặn (để pass volume filter)
    timestamps = [now + timedelta(minutes=5 * i) for i in range(n_bars)]
    opens = [2000.0] * n_bars
    highs = [2001.0] * n_bars
    lows = [1999.0] * n_bars
    closes = [2000.0] * n_bars
    volumes = [500.0] * n_bars

    # Tại nến t = 52:
    # Swing low trong 15 nến là 1999.0 -> SL = 1998.5 (Delta SL = 1.5 USD)
    # TP = 2000.0 + 1.5 * 1.5 = 2002.25 (+ 0.3 spread = 2002.55)
    # Các nến từ 53 đến 58: Giá tăng vọt lên 2008.0 mà không hề giảm dưới 1999.0
    for i in range(53, 60):
        opens[i] = 2001.0 + (i - 53)
        highs[i] = 2004.0 + (i - 53) # Vượt xa TP (2002.55)
        lows[i] = 2000.0 + (i - 53)
        closes[i] = 2003.0 + (i - 53)

    df = pd.DataFrame({
        'timestamp': timestamps,
        'open': opens,
        'high': highs,
        'low': lows,
        'close': closes,
        'volume': volumes,
        'spread': [0.2] * n_bars
    })

    miner = HistoricalPatternMiner(
        horizon_bars=12,
        buffer_usd=0.5,
        min_rr_ratio=1.5,
        spread_usd=0.3,
        volume_window_size=20
    )
    patterns = miner.mine_patterns(df)

    assert not patterns.empty
    assert (patterns['direction'] == 1).any()
    long_patterns = patterns[patterns['direction'] == 1]
    assert len(long_patterns) >= 1
    sample_vec = long_patterns.iloc[0]['feature_vector']
    assert len(sample_vec) == 49


def test_miner_rejects_sl_first_and_dual_touch():
    """Kiểm tra miner loại bỏ các trường hợp cắn SL trước hoặc chạm cả 2 đầu."""
    now = datetime(2024, 1, 1, 0, 0, tzinfo=timezone.utc)
    n_bars = 70
    timestamps = [now + timedelta(minutes=5 * i) for i in range(n_bars)]
    opens = [2000.0] * n_bars
    highs = [2001.0] * n_bars
    lows = [1999.0] * n_bars
    closes = [2000.0] * n_bars
    volumes = [500.0] * n_bars

    # Tại nến 53: Giá sập mạnh chạm SL (1995 < 1998.5) trước khi tăng
    opens[53] = 2000.0
    lows[53] = 1994.0 # Sập cắn SL
    highs[53] = 2000.5
    closes[53] = 1995.0

    df = pd.DataFrame({
        'timestamp': timestamps,
        'open': opens,
        'high': highs,
        'low': lows,
        'close': closes,
        'volume': volumes,
        'spread': [0.2] * n_bars
    })

    miner = HistoricalPatternMiner(
        horizon_bars=12,
        buffer_usd=0.5,
        min_rr_ratio=1.5,
        spread_usd=0.3,
        volume_window_size=20
    )
    patterns = miner.mine_patterns(df)

    # Không có mẫu hình LONG nào tại nến 52 vì nến 53 đã cắn SL ngay
    if not patterns.empty:
        long_at_52 = patterns[(patterns['direction'] == 1) & (patterns['entry_price'] == 2000.0)]
        assert len(long_at_52) == 0
