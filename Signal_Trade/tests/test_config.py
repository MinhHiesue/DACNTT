"""Test suite for config loader, schema validation, and logging."""
from pathlib import Path
from src.core.config_loader import load_config, AppConfig
from src.core.schemas import TradeSignal, BarData
from src.utils.logger import setup_logger
from datetime import datetime


def test_load_default_config():
    """Kiểm tra nạp config từ config.yaml thành công."""
    config = load_config()
    assert isinstance(config, AppConfig)
    assert config.system.symbol == "XAUUSD"
    assert config.system.timeframe == "M5"
    assert config.volume_filter.window_size == 100
    assert config.volume_filter.lower_percentile == 20.0
    assert config.volume_filter.upper_percentile == 85.0
    assert config.similarity_engine.min_similarity == 0.85
    assert config.similarity_engine.min_neighbors == 10
    assert config.risk_manager.min_rr_ratio == 1.5


def test_trade_signal_schema():
    """Kiểm tra validation của mô hình TradeSignal."""
    now = datetime.utcnow()
    signal = TradeSignal(
        timestamp=now,
        symbol="XAUUSD",
        direction="LONG",
        entry_price=2650.0,
        stop_loss=2646.0,
        take_profit=2656.0,
        delta_sl=4.0,
        delta_tp=6.0,
        rr_ratio=1.5,
        suggested_lot=0.25,
        confidence=0.85,
        matched_count=12,
        status="APPROVED",
    )
    assert signal.direction == "LONG"
    assert signal.rr_ratio == 1.5
    assert signal.status == "APPROVED"


def test_logger_setup(tmp_path):
    """Kiểm tra khởi tạo logger và ghi log ra file trong thư mục tạm."""
    log_dir = tmp_path / "logs"
    test_logger = setup_logger(log_level="DEBUG", logs_dir=str(log_dir))
    test_logger.info("Test message for logger")
    test_logger.complete() # Đảm bảo buffer được flush

    log_files = list(log_dir.glob("bot_*.log"))
    assert len(log_files) > 0
    with open(log_files[0], "r", encoding="utf-8") as f:
        content = f.read()
    assert "Test message for logger" in content


if __name__ == "__main__":
    print("Testing config and logger...")
    test_load_default_config()
    test_trade_signal_schema()
    print("All unit tests passed!")
