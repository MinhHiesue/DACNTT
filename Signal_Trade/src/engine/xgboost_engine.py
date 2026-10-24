"""Module XGBoost Engine: Phân loại xu hướng & Xác suất thành công của tín hiệu."""
from pathlib import Path
from typing import Optional, Union, Dict, Any, List, Tuple
import numpy as np
import pandas as pd
from loguru import logger
import xgboost as xgb
from pydantic import BaseModel, Field


# 49 tên đặc trưng ứng với FeatureExtractor
FEATURE_NAMES: List[str] = (
    [f"delta_close_t{i}" for i in range(15)] +
    [f"delta_high_t{i}" for i in range(15)] +
    [f"delta_low_t{i}" for i in range(15)] +
    ["vwap_dist_atr", "rsi_7_norm", "body_to_wick_ratio", "vol_zscore_20"]
)

CLASS_MAP = {
    0: "NO_SIGNAL",
    1: "LONG",
    2: "SHORT"
}

CLASS_REVERSE_MAP = {v: k for k, v in CLASS_MAP.items()}


class XGBoostPrediction(BaseModel):
    """Kết quả thẩm định từ mô hình XGBoost."""
    decision: str = "NO_SIGNAL"
    confidence: float = 0.0
    prob_long: float = 0.0
    prob_short: float = 0.0
    prob_neutral: float = 0.0
    top_features: Dict[str, float] = Field(default_factory=dict)
    is_model_loaded: bool = False


class XGBoostEngine:
    """
    Động cơ AI phân loại đa lớp (3-class Classifier: NO_SIGNAL, LONG, SHORT).
    Hoạt động độc lập hoặc đóng vai trò 'Trọng tài thẩm định' trong mô hình Hybrid Ensemble.
    """

    def __init__(
        self,
        model_path: Optional[Union[str, Path]] = None,
        min_confidence: float = 0.55,
        n_estimators: int = 150,
        max_depth: int = 4,
        learning_rate: float = 0.05
    ):
        self.min_confidence = min_confidence
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.learning_rate = learning_rate
        self.model: Optional[xgb.XGBClassifier] = None
        self.model_path: Optional[Path] = Path(model_path) if model_path else None
        self.feature_names = FEATURE_NAMES
        self.dimension = len(FEATURE_NAMES)

        if self.model_path and self.model_path.exists():
            self.load_model(self.model_path)

    def load_model(self, path: Union[str, Path]):
        """Nạp mô hình XGBoost đã huấn luyện từ file JSON."""
        p = Path(path)
        if not p.exists():
            raise FileNotFoundError(f"Không tìm thấy file mô hình XGBoost tại: {p.resolve()}")

        try:
            clf = xgb.XGBClassifier()
            clf.load_model(str(p))
            self.model = clf
            self.model_path = p
            logger.info(f"Đã nạp thành công mô hình XGBoost từ: {p.name}")
        except Exception as e:
            logger.error(f"Lỗi khi nạp mô hình XGBoost từ {p}: {e}")
            self.model = None

    def save_model(self, path: Union[str, Path]):
        """Lưu mô hình ra file JSON."""
        if self.model is None:
            raise ValueError("Chưa có mô hình để lưu.")
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        self.model.save_model(str(p))
        self.model_path = p
        logger.info(f"Đã lưu mô hình XGBoost ra: {p.resolve()}")

    def predict_proba(self, query_vector: np.ndarray) -> Dict[str, float]:
        """Dự đoán phân phối xác suất cho [NO_SIGNAL, LONG, SHORT]."""
        if self.model is None:
            return {"NO_SIGNAL": 1.0, "LONG": 0.0, "SHORT": 0.0}

        vec = np.asarray(query_vector, dtype=np.float32).reshape(1, -1)
        if vec.shape[1] != self.dimension:
            raise ValueError(f"Vector kích thước sai: {vec.shape[1]} != {self.dimension}")

        probs = self.model.predict_proba(vec)[0]
        # Đảm bảo đủ 3 lớp xác suất
        p_neutral = float(probs[0]) if len(probs) > 0 else 0.0
        p_long = float(probs[1]) if len(probs) > 1 else 0.0
        p_short = float(probs[2]) if len(probs) > 2 else 0.0

        return {
            "NO_SIGNAL": round(p_neutral, 4),
            "LONG": round(p_long, 4),
            "SHORT": round(p_short, 4)
        }

    def predict(self, query_vector: np.ndarray) -> XGBoostPrediction:
        """Đưa ra quyết định phân loại kèm độ tin cậy."""
        if self.model is None:
            return XGBoostPrediction(
                decision="NO_SIGNAL",
                confidence=0.0,
                prob_long=0.0,
                prob_short=0.0,
                prob_neutral=1.0,
                top_features={},
                is_model_loaded=False
            )

        probs = self.predict_proba(query_vector)
        p_long = probs["LONG"]
        p_short = probs["SHORT"]
        p_neutral = probs["NO_SIGNAL"]

        if p_long >= self.min_confidence and p_long > p_short:
            decision = "LONG"
            confidence = p_long
        elif p_short >= self.min_confidence and p_short > p_long:
            decision = "SHORT"
            confidence = p_short
        else:
            decision = "NO_SIGNAL"
            confidence = max(p_neutral, p_long, p_short)

        top_features = self.get_top_features(limit=5)

        return XGBoostPrediction(
            decision=decision,
            confidence=round(confidence, 4),
            prob_long=p_long,
            prob_short=p_short,
            prob_neutral=p_neutral,
            top_features=top_features,
            is_model_loaded=True
        )

    def get_feature_importances(self) -> Dict[str, float]:
        """Lấy danh sách xếp hạng tầm quan trọng của tất cả 49 đặc trưng."""
        if self.model is None or not hasattr(self.model, "feature_importances_"):
            return {name: 0.0 for name in self.feature_names}

        importances = self.model.feature_importances_
        result = {}
        for name, val in zip(self.feature_names, importances):
            result[name] = round(float(val), 4)

        return dict(sorted(result.items(), key=lambda item: item[1], reverse=True))

    def get_top_features(self, limit: int = 5) -> Dict[str, float]:
        """Lấy top N đặc trưng quan trọng nhất."""
        all_feats = self.get_feature_importances()
        return dict(list(all_feats.items())[:limit])
