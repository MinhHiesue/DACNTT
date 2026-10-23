"""Unit tests cho Module 5: Chart Plotter và TelegramNotifier."""
from datetime import datetime, timezone
import io
from unittest.mock import MagicMock, patch
import pandas as pd
import pytest

from src.core.schemas import TradeSignal
from src.core.config_loader import TelegramCredentials
from src.execution.chart_plotter import generate_signal_chart_image
from src.execution.telegram_bot import TelegramNotifier


@pytest.fixture
def sample_signal():
    """Tạo TradeSignal mẫu cho BTCUSDT."""
    return TradeSignal(
        timestamp=datetime(2024, 1, 1, 12, 0, tzinfo=timezone.utc),
        symbol="BTCUSDT",
        direction="LONG",
        entry_price=65000.00,
        stop_loss=64600.00,
        take_profit=65600.00,
        delta_sl=400.00,
        delta_tp=600.00,
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
            'open': 64800.0 + (i * 10.0),
            'high': 65200.0 + (i * 10.0),
            'low': 64600.0 + (i * 10.0),
            'close': 65000.0 + (i * 10.0),
            'volume': 50.0
        })
    return pd.DataFrame(bars)


def test_generate_signal_chart_image(sample_signal, sample_setup_bars):
    """Kiểm tra tạo ảnh biểu đồ snapshot nến M5 trả về đúng chuẩn PNG buffer."""
    buf = generate_signal_chart_image(sample_signal, sample_setup_bars)
    assert buf is not None
    assert isinstance(buf, io.BytesIO)
    content = buf.getvalue()
    assert len(content) > 1000 # File PNG hợp lệ có dung lượng
    assert content[:4] == b'\x89PNG'


def test_telegram_message_formatter(sample_signal):
    """Kiểm tra bản tin cảnh báo HTML chứa đầy đủ các thông số giao dịch then chốt."""
    msg = TelegramNotifier.format_signal_message(sample_signal)
    assert "BTCUSDT M5 PATTERN SIGNAL" in msg
    assert "65,000.00" in msg # Entry
    assert "64,600.00" in msg # SL
    assert "65,600.00" in msg # TP
    assert "1.50" in msg    # R:R
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
