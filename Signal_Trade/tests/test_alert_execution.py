"""Unit tests cho Module 5: Chart Plotter, TelegramNotifier và MT5Executor."""
from datetime import datetime, timezone
import io
from unittest.mock import MagicMock, patch
import pandas as pd
import pytest

from src.core.schemas import TradeSignal
from src.core.config_loader import TelegramCredentials
from src.execution.chart_plotter import generate_signal_chart_image
from src.execution.telegram_bot import TelegramNotifier
from src.execution.mt5_executor import MT5Executor


@pytest.fixture
def sample_signal():
    """Tạo TradeSignal mẫu."""
    return TradeSignal(
        timestamp=datetime(2024, 1, 1, 12, 0, tzinfo=timezone.utc),
        symbol="XAUUSD",
        direction="LONG",
        entry_price=2650.00,
        stop_loss=2646.00,
        take_profit=2656.00,
        delta_sl=4.00,
        delta_tp=6.00,
        rr_ratio=1.50,
        suggested_lot=0.25,
        confidence=0.875,
        matched_count=14,
        status="APPROVED"
    )


@pytest.fixture
def sample_setup_bars():
    """Tạo 15 nến setup M5 mẫu."""
    now = datetime(2024, 1, 1, 12, 0, tzinfo=timezone.utc)
    bars = []
    for i in range(15):
        bars.append({
            'timestamp': now + pd.Timedelta(minutes=5 * i),
            'open': 2648.0 + (i * 0.1),
            'high': 2652.0 + (i * 0.1),
            'low': 2646.0 + (i * 0.1),
            'close': 2650.0 + (i * 0.1),
            'volume': 500.0
        })
    return pd.DataFrame(bars)


def test_generate_signal_chart_image(sample_signal, sample_setup_bars):
    """Kiểm tra tạo ảnh biểu đồ snapshot nến M5 trả về đúng chuẩn PNG buffer."""
    buf = generate_signal_chart_image(sample_signal, sample_setup_bars)
    assert buf is not None
    assert isinstance(buf, io.BytesIO)
    content = buf.getvalue()
    assert len(content) > 1000 # File PNG hợp lệ có dung lượng
    # Header chuẩn của file PNG: \x89PNG
    assert content[:4] == b'\x89PNG'


def test_telegram_message_formatter(sample_signal):
    """Kiểm tra bản tin cảnh báo HTML chứa đầy đủ các thông số giao dịch then chốt."""
    msg = TelegramNotifier.format_signal_message(sample_signal)
    assert "XAU/USD M5 PATTERN ALERT" in msg
    assert "2650.00" in msg # Entry
    assert "2646.00" in msg # SL
    assert "2656.00" in msg # TP
    assert "1.50" in msg    # R:R
    assert "0.25 Lot" in msg
    assert "87.5%" in msg   # Confidence
    assert "14 mẫu" in msg


def test_telegram_notifier_without_credentials_does_not_crash(sample_signal):
    """Kiểm tra bot không crash khi chưa cấu hình token mà chỉ log thông tin."""
    notifier = TelegramNotifier(credentials=None)
    res = notifier.send_signal_alert(sample_signal)
    assert res is False


@patch('requests.post')
def test_telegram_notifier_send_alert_mock(mock_post, sample_signal, sample_setup_bars):
    """Kiểm tra gửi cảnh báo thành công qua Telegram API khi mock response HTTP 200."""
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_post.return_value = mock_resp

    creds = TelegramCredentials(bot_token="test_token", chat_id="123456")
    notifier = TelegramNotifier(credentials=creds)

    res = notifier.send_signal_alert(sample_signal, sample_setup_bars)
    assert res is True
    assert mock_post.called


@patch('src.execution.mt5_executor.mt5')
def test_mt5_executor_market_order_success(mock_mt5, sample_signal):
    """Kiểm tra MT5Executor khớp lệnh thành công khi sàn trả về TRADE_RETCODE_DONE."""
    mock_terminal = MagicMock()
    mock_terminal.connected = True
    mock_mt5.terminal_info.return_value = mock_terminal
    mock_mt5.symbol_select.return_value = True

    mock_tick = MagicMock()
    mock_tick.ask = 2650.10
    mock_tick.bid = 2649.90
    mock_mt5.symbol_info_tick.return_value = mock_tick

    mock_sym_info = MagicMock()
    mock_sym_info.filling_mode = 1 # SYMBOL_FILLING_FOK
    mock_mt5.symbol_info.return_value = mock_sym_info

    mock_result = MagicMock()
    mock_result.retcode = 10009 # TRADE_RETCODE_DONE
    mock_result.order = 998877
    mock_result.volume = 0.25
    mock_result.price = 2650.10
    mock_mt5.order_send.return_value = mock_result
    mock_mt5.TRADE_RETCODE_DONE = 10009
    mock_mt5.TRADE_ACTION_DEAL = 1
    mock_mt5.ORDER_TYPE_BUY = 0
    mock_mt5.ORDER_TIME_GTC = 0
    mock_mt5.ORDER_FILLING_FOK = 0
    mock_mt5.ORDER_FILLING_IOC = 1
    mock_mt5.SYMBOL_FILLING_FOK = 1
    mock_mt5.SYMBOL_FILLING_IOC = 2

    executor = MT5Executor()
    res = executor.execute_market_order(sample_signal)

    assert res['status'] == "SUCCESS"
    assert res['ticket'] == 998877
    assert res['price'] == 2650.10
