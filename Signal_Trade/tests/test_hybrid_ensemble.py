"""Test suite for HybridEnsembleEngine."""
from pathlib import Path
from unittest.mock import MagicMock
import numpy as np
import pytest

from src.core.schemas import MatchResult
from src.engine.similarity_engine import SimilarityEngine
from src.engine.xgboost_engine import XGBoostEngine, XGBoostPrediction
from src.engine.hybrid_ensemble import HybridEnsembleEngine, HybridMatchResult


def test_hybrid_ensemble_no_faiss_match():
    """Khi FAISS không có mẫu khớp -> Hybrid trả về NO_SIGNAL ngay lập tức."""
    mock_similarity = MagicMock(spec=SimilarityEngine)
    mock_similarity.find_matches.return_value = MatchResult(
        decision="NO_SIGNAL",
        confidence=0.0,
        total_matches=0,
        long_matches=0,
        short_matches=0,
        avg_similarity=0.0,
        matched_indices=[]
    )

    ensemble = HybridEnsembleEngine(similarity_engine=mock_similarity, xgboost_engine=None)
    dummy_vec = np.zeros(49, dtype=np.float32)

    res = ensemble.evaluate(dummy_vec)
    assert isinstance(res, HybridMatchResult)
    assert res.decision == "NO_SIGNAL"
    assert res.status == "NO_MATCH"


def test_hybrid_ensemble_confirmed_by_xgboost():
    """Khi FAISS báo LONG và XGBoost đồng thuận xác nhận -> Hybrid CONFIRMED."""
    mock_similarity = MagicMock(spec=SimilarityEngine)
    mock_similarity.find_matches.return_value = MatchResult(
        decision="LONG",
        confidence=0.88,
        total_matches=15,
        long_matches=14,
        short_matches=1,
        avg_similarity=0.91,
        matched_indices=[0, 1, 2]
    )

    mock_xgboost = MagicMock(spec=XGBoostEngine)
    mock_xgboost.model = True # Mô hình đã nạp
    mock_xgboost.predict.return_value = XGBoostPrediction(
        decision="LONG",
        confidence=0.75,
        prob_long=0.75,
        prob_short=0.10,
        prob_neutral=0.15,
        top_features={"rsi_7_norm": 0.25},
        is_model_loaded=True
    )

    ensemble = HybridEnsembleEngine(
        similarity_engine=mock_similarity,
        xgboost_engine=mock_xgboost,
        min_xgboost_prob=0.50
    )
    dummy_vec = np.zeros(49, dtype=np.float32)

    res = ensemble.evaluate(dummy_vec)
    assert res.decision == "LONG"
    assert res.status == "CONFIRMED_BY_XGBOOST"
    # Blended confidence: 0.5 * 0.88 + 0.5 * 0.75 = 0.815
    assert pytest.approx(res.confidence, abs=1e-3) == 0.815

    # Kiểm tra chuyển đổi sang MatchResult cho RiskManager
    match_converted = res.to_match_result()
    assert match_converted.decision == "LONG"
    assert match_converted.total_matches == 15


def test_hybrid_ensemble_filtered_by_xgboost():
    """Khi FAISS báo LONG nhưng XGBoost từ chối (xác suất thấp) -> Lọc tín hiệu giả."""
    mock_similarity = MagicMock(spec=SimilarityEngine)
    mock_similarity.find_matches.return_value = MatchResult(
        decision="LONG",
        confidence=0.82,
        total_matches=12,
        long_matches=10,
        short_matches=2,
        avg_similarity=0.89,
        matched_indices=[0, 1]
    )

    mock_xgboost = MagicMock(spec=XGBoostEngine)
    mock_xgboost.model = True
    mock_xgboost.predict.return_value = XGBoostPrediction(
        decision="NO_SIGNAL",
        confidence=0.60,
        prob_long=0.30, # Quá thấp (< 0.50)
        prob_short=0.20,
        prob_neutral=0.50,
        top_features={},
        is_model_loaded=True
    )

    ensemble = HybridEnsembleEngine(
        similarity_engine=mock_similarity,
        xgboost_engine=mock_xgboost,
        min_xgboost_prob=0.50
    )
    dummy_vec = np.zeros(49, dtype=np.float32)

    res = ensemble.evaluate(dummy_vec)
    assert res.decision == "NO_SIGNAL"
    assert res.status == "FILTERED_BY_XGBOOST"
    assert "Bị lọc bởi XGBoost" in res.reason
