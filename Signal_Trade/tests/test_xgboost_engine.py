"""Test suite for XGBoostEngine."""
from pathlib import Path
import numpy as np
import pytest

from src.engine.xgboost_engine import XGBoostEngine, XGBoostPrediction, FEATURE_NAMES


def test_xgboost_engine_initialization_without_model():
    """Kiểm tra khởi tạo XGBoostEngine khi không có model vẫn hoạt động an toàn."""
    engine = XGBoostEngine(model_path=None)
    assert engine.model is None
    assert engine.dimension == 49

    dummy_vec = np.zeros(49, dtype=np.float32)
    pred = engine.predict(dummy_vec)
    assert isinstance(pred, XGBoostPrediction)
    assert pred.decision == "NO_SIGNAL"
    assert pred.confidence == 0.0
    assert pred.is_model_loaded is False


def test_xgboost_engine_with_trained_model():
    """Kiểm tra nạp mô hình xgboost_hybrid.json đã huấn luyện và dự đoán."""
    model_path = Path("models/xgboost_hybrid.json")
    if not model_path.exists():
        pytest.skip("Chưa có models/xgboost_hybrid.json")

    engine = XGBoostEngine(model_path=model_path, min_confidence=0.45)
    assert engine.model is not None

    dummy_vec = np.random.randn(49).astype(np.float32)
    pred = engine.predict(dummy_vec)
    assert pred.decision in ["NO_SIGNAL", "LONG", "SHORT"]
    assert 0.0 <= pred.confidence <= 1.0
    assert pred.is_model_loaded is True

    probs = engine.predict_proba(dummy_vec)
    assert "LONG" in probs
    assert "SHORT" in probs
    assert "NO_SIGNAL" in probs
    total_p = probs["LONG"] + probs["SHORT"] + probs["NO_SIGNAL"]
    assert pytest.approx(total_p, abs=1e-2) == 1.0

    # Kiểm tra top features
    top_feats = engine.get_top_features(limit=5)
    assert len(top_feats) <= 5
    for k, v in top_feats.items():
        assert k in FEATURE_NAMES
        assert v >= 0.0
