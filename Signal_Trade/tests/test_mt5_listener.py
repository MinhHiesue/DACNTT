"""Unit tests cho RealtimeBarListener (kiểm tra Cold Start, Deduplication, Event Trigger)."""
from unittest.mock import MagicMock, patch
import numpy as np
import pandas as pd
import pytest

from src.execution.mt5_listener import RealtimeBarListener


def make_mock_rates(base_time: int = 1700000000, num_bars: int = 105):
    """Tạo mảng có cấu trúc numpy giả lập dữ liệu trả về từ mt5.copy_rates_from_pos."""
    dtype = [
        ('time', '<i8'),
        ('open', '<f8'),
        ('high', '<f8'),
        ('low', '<f8'),
        ('close', '<f8'),
        ('tick_volume', '<i8'),
        ('spread', '<i4'),
        ('real_volume', '<i8')
    ]
    rates = np.zeros(num_bars, dtype=dtype)
    for i in range(num_bars):
        t = base_time + (i * 300) # Mỗi bar cách nhau 300 giây (5 phút)
        rates[i] = (t, 2000.0, 2002.0, 1999.0, 2001.0, 150, 20, 0)
    return rates


@patch('src.execution.mt5_listener.mt5')
def test_cold_start_does_not_trigger_event(mock_mt5):
    """Kiểm tra Cold Start: Lần đầu khởi động chỉ ghi nhận mốc thời gian, không phát sinh event."""
    mock_terminal = MagicMock()
    mock_terminal.connected = True
    mock_mt5.terminal_info.return_value = mock_terminal

    rates_batch1 = make_mock_rates(base_time=1700000000, num_bars=105)
    mock_mt5.copy_rates_from_pos.return_value = rates_batch1

    listener = RealtimeBarListener(symbol="XAUUSD")

    # Lần 1: Cold start
    res1 = listener.check_for_closed_bar()
    assert res1 is None, "Cold start không được kích hoạt nến cũ"
    # Mốc thời gian được ghi nhận là nến [-2]
    expected_last_time = int(rates_batch1[-2]['time'])
    assert listener.last_processed_time == expected_last_time


@patch('src.execution.mt5_listener.mt5')
def test_deduplication_ignores_same_bar(mock_mt5):
    """Kiểm tra chống gọi trùng: Nếu nến chưa đổi thì không phát sinh event."""
    mock_terminal = MagicMock()
    mock_terminal.connected = True
    mock_mt5.terminal_info.return_value = mock_terminal

    rates = make_mock_rates(base_time=1700000000, num_bars=105)
    mock_mt5.copy_rates_from_pos.return_value = rates

    listener = RealtimeBarListener(symbol="XAUUSD")
    _ = listener.check_for_closed_bar() # Cold start

    # Lần 2: Vẫn là nến đó
    res2 = listener.check_for_closed_bar()
    assert res2 is None, "Không được kích hoạt khi nến chưa đổi"


@patch('src.execution.mt5_listener.mt5')
def test_new_bar_triggers_event(mock_mt5):
    """Kiểm tra khi có nến mới đóng: listener phát hiện và trả về DataFrame 104 nến đã đóng."""
    mock_terminal = MagicMock()
    mock_terminal.connected = True
    mock_mt5.terminal_info.return_value = mock_terminal

    rates_batch1 = make_mock_rates(base_time=1700000000, num_bars=105)
    mock_mt5.copy_rates_from_pos.return_value = rates_batch1

    listener = RealtimeBarListener(symbol="XAUUSD")
    _ = listener.check_for_closed_bar() # Cold start

    # Giả lập thời gian trôi qua 300s, xuất hiện nến mới (toàn bộ nến trượt lên 1 nến)
    rates_batch2 = make_mock_rates(base_time=1700000000 + 300, num_bars=105)
    mock_mt5.copy_rates_from_pos.return_value = rates_batch2

    res3 = listener.check_for_closed_bar()
    assert res3 is not None, "Phải bắt được sự kiện nến mới"
    assert isinstance(res3, pd.DataFrame)
    # Trả về 104 nến đã đóng (bỏ nến [-1])
    assert len(res3) == 104
    assert 'timestamp' in res3.columns
    assert 'volume' in res3.columns


@patch('src.execution.mt5_listener.mt5')
def test_start_listening_with_callback_and_graceful_stop(mock_mt5):
    """Kiểm tra vòng lặp lắng nghe gọi đúng callback và dừng an toàn."""
    mock_terminal = MagicMock()
    mock_terminal.connected = True
    mock_mt5.terminal_info.return_value = mock_terminal

    # Chuẩn bị dữ liệu nến cho 3 lần polling
    rates_init = make_mock_rates(base_time=1700000000, num_bars=105)
    rates_new = make_mock_rates(base_time=1700000000 + 300, num_bars=105)
    mock_mt5.copy_rates_from_pos.side_effect = [rates_init, rates_new, rates_new]

    callback_mock = MagicMock()
    listener = RealtimeBarListener(symbol="XAUUSD", poll_interval_sec=0.01)

    # Chạy tối đa 3 lần lặp rồi dừng
    listener.start_listening(callback_on_bar=callback_mock, max_iterations=3)

    # Callback chỉ được gọi duy nhất 1 lần (ở lần polling thứ 2 khi nến mới xuất hiện)
    assert callback_mock.call_count == 1
    assert not listener.is_running
