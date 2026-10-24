"""Module Hybrid Ensemble: Kết hợp đa tầng FAISS Pattern Matching + XGBoost Classifier."""
from typing import Optional, Dict, Any, List
import numpy as np
from pydantic import BaseModel, Field
from loguru import logger

from src.core.schemas import MatchResult
from src.engine.similarity_engine import SimilarityEngine
from src.engine.xgboost_engine import XGBoostEngine, XGBoostPrediction


class HybridMatchResult(BaseModel):
    """Kết quả thẩm định hợp nhất từ FAISS + XGBoost."""
    decision: str = "NO_SIGNAL"
    confidence: float = 0.0
    status: str = "NO_SIGNAL" # CONFIRMED_BY_XGBOOST, FILTERED_BY_XGBOOST, FAISS_ONLY, NO_MATCH
    reason: Optional[str] = None
    
    # Thông số FAISS
    faiss_decision: str = "NO_SIGNAL"
    faiss_confidence: float = 0.0
    faiss_matched_count: int = 0
    faiss_avg_similarity: float = 0.0
    matched_indices: List[int] = Field(default_factory=list)

    # Thông số XGBoost
    xgboost_decision: str = "NO_SIGNAL"
    xgboost_prob_long: float = 0.0
    xgboost_prob_short: float = 0.0
    xgboost_prob_neutral: float = 0.0
    top_features: Dict[str, float] = Field(default_factory=dict)
    is_xgboost_active: bool = False

    def to_match_result(self) -> MatchResult:
        """Chuyển đổi tương thích ngược với MatchResult chuẩn cho RiskManager."""
        return MatchResult(
            decision=self.decision,
            confidence=self.confidence,
            total_matches=self.faiss_matched_count,
            long_matches=int(self.faiss_matched_count * self.faiss_confidence) if self.faiss_decision == "LONG" else 0,
            short_matches=int(self.faiss_matched_count * self.faiss_confidence) if self.faiss_decision == "SHORT" else 0,
            avg_similarity=self.faiss_avg_similarity,
            matched_indices=self.matched_indices
        )


class HybridEnsembleEngine:
    """
    Động cơ AI Kết hợp (Dual-Engine Ensemble):
    - Tầng 1: FAISS Similarity Engine quét tìm mẫu hình ký ức lịch sử tương đồng (>= 85%).
    - Tầng 2: XGBoost Classifier thẩm định xác suất thắng vi mô dựa trên 49 đặc trưng.
    Chỉ phê duyệt phát tín hiệu khi CẢ HAI mô hình đồng thuận cùng hướng.
    """

    def __init__(
        self,
        similarity_engine: Optional[SimilarityEngine] = None,
        xgboost_engine: Optional[XGBoostEngine] = None,
        min_xgboost_prob: float = 0.50,
        blend_weight_faiss: float = 0.50,
        blend_weight_xgboost: float = 0.50
    ):
        self.similarity_engine = similarity_engine
        self.xgboost_engine = xgboost_engine
        self.min_xgboost_prob = min_xgboost_prob
        self.blend_w_faiss = blend_weight_faiss
        self.blend_w_xgb = blend_weight_xgboost

    def evaluate(self, query_vector: np.ndarray) -> HybridMatchResult:
        """
        Đánh giá vector 49 chiều qua bộ lọc kép FAISS + XGBoost.
        """
        # 1. Đánh giá tầng 1: FAISS Pattern Matching
        if self.similarity_engine is None:
            faiss_res = MatchResult(
                decision="NO_SIGNAL",
                confidence=0.0,
                total_matches=0,
                long_matches=0,
                short_matches=0,
                avg_similarity=0.0,
                matched_indices=[]
            )
        else:
            faiss_res = self.similarity_engine.find_matches(query_vector)

        # 2. Đánh giá tầng 2: XGBoost Classifier
        xgb_active = False
        xgb_pred = XGBoostPrediction()
        if self.xgboost_engine is not None and self.xgboost_engine.model is not None:
            xgb_pred = self.xgboost_engine.predict(query_vector)
            xgb_active = xgb_pred.is_model_loaded

        # 3. Tổng hợp biểu quyết (Ensemble Consensus)
        # Trường hợp 3.1: FAISS không tìm thấy mẫu hình
        if faiss_res.decision == "NO_SIGNAL":
            return HybridMatchResult(
                decision="NO_SIGNAL",
                confidence=0.0,
                status="NO_MATCH",
                reason="Không có đủ mẫu hình tương đồng trong ký ức lịch sử (FAISS)",
                faiss_decision="NO_SIGNAL",
                faiss_confidence=faiss_res.confidence,
                faiss_matched_count=faiss_res.total_matches,
                faiss_avg_similarity=faiss_res.avg_similarity,
                matched_indices=faiss_res.matched_indices,
                xgboost_decision=xgb_pred.decision,
                xgboost_prob_long=xgb_pred.prob_long,
                xgboost_prob_short=xgb_pred.prob_short,
                xgboost_prob_neutral=xgb_pred.prob_neutral,
                top_features=xgb_pred.top_features,
                is_xgboost_active=xgb_active
            )

        # Trường hợp 3.2: FAISS có tín hiệu nhưng chưa bật/chưa nạp model XGBoost (Chạy FAISS Fallback)
        if not xgb_active:
            return HybridMatchResult(
                decision=faiss_res.decision,
                confidence=faiss_res.confidence,
                status="FAISS_ONLY",
                reason="Mô hình XGBoost chưa nạp, sử dụng kết quả FAISS độc lập.",
                faiss_decision=faiss_res.decision,
                faiss_confidence=faiss_res.confidence,
                faiss_matched_count=faiss_res.total_matches,
                faiss_avg_similarity=faiss_res.avg_similarity,
                matched_indices=faiss_res.matched_indices,
                xgboost_decision="NONE",
                xgboost_prob_long=0.0,
                xgboost_prob_short=0.0,
                xgboost_prob_neutral=1.0,
                top_features={},
                is_xgboost_active=False
            )

        # Trường hợp 3.3: Cả 2 mô hình cùng hoạt động (Chế độ Hybrid chuẩn)
        target_dir = faiss_res.decision # "LONG" hoặc "SHORT"
        xgb_target_prob = xgb_pred.prob_long if target_dir == "LONG" else xgb_pred.prob_short

        # Điều kiện đồng thuận: XGBoost xác nhận cùng hướng với xác suất >= min_xgboost_prob
        if xgb_target_prob >= self.min_xgboost_prob:
            # Hai mô hình cùng ĐỒNG THUẬN -> Tính điểm tin cậy trọng số kết hợp
            blended_conf = (
                self.blend_w_faiss * faiss_res.confidence +
                self.blend_w_xgb * xgb_target_prob
            )
            return HybridMatchResult(
                decision=target_dir,
                confidence=round(blended_conf, 4),
                status="CONFIRMED_BY_XGBOOST",
                reason=f"Đồng thuận tuyệt đối: FAISS ({faiss_res.confidence*100:.1f}%) + XGBoost ({xgb_target_prob*100:.1f}%)",
                faiss_decision=faiss_res.decision,
                faiss_confidence=faiss_res.confidence,
                faiss_matched_count=faiss_res.total_matches,
                faiss_avg_similarity=faiss_res.avg_similarity,
                matched_indices=faiss_res.matched_indices,
                xgboost_decision=xgb_pred.decision,
                xgboost_prob_long=xgb_pred.prob_long,
                xgboost_prob_short=xgb_pred.prob_short,
                xgboost_prob_neutral=xgb_pred.prob_neutral,
                top_features=xgb_pred.top_features,
                is_xgboost_active=True
            )
        else:
            # Xung đột / Phân kỳ: FAISS báo lệnh nhưng XGBoost từ chối do xác suất thấp
            return HybridMatchResult(
                decision="NO_SIGNAL",
                confidence=round(faiss_res.confidence, 4),
                status="FILTERED_BY_XGBOOST",
                reason=(
                    f"Bị lọc bởi XGBoost: FAISS báo {target_dir} ({faiss_res.confidence*100:.1f}%), "
                    f"nhưng XGBoost chỉ đạt {xgb_target_prob*100:.1f}% (< ngưỡng {self.min_xgboost_prob*100:.1f}%)"
                ),
                faiss_decision=faiss_res.decision,
                faiss_confidence=faiss_res.confidence,
                faiss_matched_count=faiss_res.total_matches,
                faiss_avg_similarity=faiss_res.avg_similarity,
                matched_indices=faiss_res.matched_indices,
                xgboost_decision=xgb_pred.decision,
                xgboost_prob_long=xgb_pred.prob_long,
                xgboost_prob_short=xgb_pred.prob_short,
                xgboost_prob_neutral=xgb_pred.prob_neutral,
                top_features=xgb_pred.top_features,
                is_xgboost_active=True
            )
