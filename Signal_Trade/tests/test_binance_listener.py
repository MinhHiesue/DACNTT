"""Unit tests cho BinanceBarListener (kiểm tra Cold Start, Deduplication, Event Trigger)."""
from unittest.mock import MagicMock
import numpy as np
import pandas as pd
import pytest

from src.execution.binance_listener import BinanceBarListener


def make_mock_dataframe(base_time: int = 1700000000, num_bars: int = 105) -> pd.DataFrame:
    """Tạo DataFrame giả lập dữ liệu trả về từ BinanceDataLoader."""
    timestamps = [pd.to_datetime(base_time + (i * 300), unit='s', utc=True) for i in range(num_bars)]
    opens = [65000.0 + i for i in range(num_bars)]
    highs = [65100.0 + i for i in range(num_bars)]
    lows = [64900.0 + i for i in range(num_bars)]
    closes = [65050.0 + i for i in range(num_bars)]
    volumes = [10.0 + i for i in range(num_bars)]

    return pd.DataFrame({
        'timestamp': timestamps,
        'open': opens,
        'high': highs,
        'low': lows,
        'close': closes,
        'volume': volumes,
        'spread': 0.0
    })


def test_cold_start_does_not_trigger_event():
    """Kiểm tra Cold Start: Lần đầu khởi động chỉ ghi nhận mốc thời gian, không phát sinh event."""
    mock_loader = MagicMock()
    df_batch1 = make_mock_dataframe(base_time=1700000000, num_bars=105)
    mock_loader.fetch_recent_bars.return_value = df_batch1

    listener = BinanceBarListener(symbol="BTCUSDT", data_loader=mock_loader, use_websocket=False)

    # Lần 1: Cold start
    res1 = listener.check_for_closed_bar()
    assert res1 is None, "Cold start không được kích hoạt nến cũ"

    expected_last_time = int(df_batch1.iloc[-2]['timestamp'].timestamp())
    assert listener.last_processed_time == expected_last_time


def test_deduplication_ignores_same_bar():
    """Kiểm tra chống gọi trùng: Nếu nến chưa đổi thì không phát sinh event."""
    mock_loader = MagicMock()
    df_batch = make_mock_dataframe(base_time=1700000000, num_bars=105)
    mock_loader.fetch_recent_bars.return_value = df_batch

    listener = BinanceBarListener(symbol="BTCUSDT", data_loader=mock_loader, use_websocket=False)
    _ = listener.check_for_closed_bar() # Cold start

    # Lần 2: Vẫn là nến đó
    res2 = listener.check_for_closed_bar()
    assert res2 is None, "Không được kích hoạt khi nến chưa đổi"


def test_new_bar_triggers_event():
    """Kiểm tra khi có nến mới đóng: listener phát hiện và trả về DataFrame 104 nến đã đóng."""
    mock_loader = MagicMock()
    df_batch1 = make_mock_dataframe(base_time=1700000000, num_bars=105)
    mock_loader.fetch_recent_bars.return_value = df_batch1

    listener = BinanceBarListener(symbol="BTCUSDT", data_loader=mock_loader, use_websocket=False)
    _ = listener.check_for_closed_bar() # Cold start

    # Nến mới xuất hiện sau 300s
    df_batch2 = make_mock_dataframe(base_time=1700000000 + 300, num_bars=105)
    mock_loader.fetch_recent_bars.return_value = df_batch2

    res3 = listener.check_for_closed_bar()
    assert res3 is not None, "Phải bắt được sự kiện nến mới"
    assert isinstance(res3, pd.DataFrame)
    assert len(res3) == 104
    assert 'timestamp' in res3.columns
    assert 'volume' in res3.columns


def test_start_listening_with_callback_and_graceful_stop():
    """Kiểm tra vòng lặp lắng nghe gọi đúng callback và dừng an toàn."""
    mock_loader = MagicMock()
    df_init = make_mock_dataframe(base_time=1700000000, num_bars=105)
    df_new = make_mock_dataframe(base_time=1700000000 + 300, num_bars=105)
    mock_loader.fetch_recent_bars.side_effect = [df_init, df_new, df_new]

    callback_mock = MagicMock()
    listener = BinanceBarListener(
        symbol="BTCUSDT",
        poll_interval_sec=0.01,
        data_loader=mock_loader,
        use_websocket=False
    )

    listener.start_listening(callback_on_bar=callback_mock, max_iterations=3)

    assert callback_mock.call_count == 1
    assert not listener.is_running
