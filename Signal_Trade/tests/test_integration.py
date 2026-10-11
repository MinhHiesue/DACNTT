"""End-to-End Integration Test cho toàn bộ Pipeline hệ thống."""
from pathlib import Path
from unittest.mock import MagicMock, patch
import pandas as pd
import numpy as np
import pytest

from src.core.config_loader import load_config
from src.features.volume_filter import VolumeRegimeFilter
from src.features.extractor import FeatureExtractor
from src.engine.similarity_engine import SimilarityEngine
from src.engine.risk_manager import RiskManager
from src.execution.telegram_bot import TelegramNotifier
from src.data.storage import load_from_parquet
from scripts.download_data import generate_synthetic_data


def test_full_pipeline_end_to_end():
    """
    TÍCH HỢP TOÀN DIỆN (E2E PIPELINE):
    Dữ liệu 100 nến -> Volume Filter -> Feature Extractor (49D)
    -> Similarity Engine (FAISS) -> Risk Manager (SL/TP/Lot) -> Telegram Alert
    """
    config = load_config()

    # 1. Khởi tạo toàn bộ module
    volume_filter = VolumeRegimeFilter()
    feature_extractor = FeatureExtractor()

    pattern_db_path = Path("data/patterns/winning_patterns.parquet")
    if not pattern_db_path.exists():
        pytest.skip("Chưa có database winning_patterns.parquet")

    similarity_engine = SimilarityEngine(parquet_path=pattern_db_path)
    risk_manager = RiskManager(account_balance=10000.0)
    telegram_bot = TelegramNotifier(credentials=None) # Mock mode

    # 2. Tạo 100 nến đóng giả lập
    bars_df = generate_synthetic_data(num_bars=100)

    # 3. Chạy qua Pipeline
    # Bước 1: Volume Filter
    vol_eval = volume_filter.evaluate_bar(bars_df['volume'].values)
    assert isinstance(vol_eval.pass_filter, bool)

    # Bước 2: Feature Extractor
    vec = feature_extractor.extract_from_window(bars_df.iloc[-50:])
    assert vec.shape == (49,)

    # Bước 3: Similarity Engine
    match_res = similarity_engine.find_matches(vec)
    assert match_res.decision in ["LONG", "SHORT", "NO_SIGNAL"]

    # Bước 4: Risk Manager
    setup_15 = bars_df.iloc[-15:]
    signal = risk_manager.evaluate_signal(match_res, setup_15, symbol="XAUUSD")
    assert signal.status in ["APPROVED", "REJECTED"]

    # Bước 5: Thử nghiệm gửi Telegram alert (sẽ log mô phỏng an toàn)
    sent = telegram_bot.send_signal_alert(signal, setup_bars=setup_15)
    # Vì token None nên hàm trả về False và in log mô phỏng mà không bị crash
    assert sent is False
