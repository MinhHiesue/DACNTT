"""Data schemas and transfer models used across the system."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class BarData(BaseModel):
    """Mô hình đại diện cho một nến M5."""
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float
    spread: Optional[float] = 0.0


class VolumeFilterResult(BaseModel):
    """Kết quả kiểm tra từ Volume Regime Filter."""
    pass_filter: bool
    current_vol: float
    p20: float
    p85: float
    reason: str


class MatchResult(BaseModel):
    """Kết quả so khớp từ Similarity Engine."""
    decision: str = Field(description="LONG, SHORT, hoặc NO_SIGNAL")
    confidence: float = Field(ge=0.0, le=1.0, description="Tỷ lệ đồng thuận hướng đi")
    total_matches: int = Field(ge=0, description="Tổng số mẫu thỏa mãn ngưỡng similarity")
    long_matches: int = 0
    short_matches: int = 0
    avg_similarity: float = 0.0
    matched_indices: List[int] = Field(default_factory=list)


class TradeSignal(BaseModel):
    """Tín hiệu giao dịch hoàn chỉnh sau khi thẩm định rủi ro."""
    timestamp: datetime
    symbol: str
    direction: str = Field(description="LONG hoặc SHORT")
    entry_price: float
    stop_loss: float
    take_profit: float
    delta_sl: float
    delta_tp: float
    rr_ratio: float
    suggested_lot: float
    confidence: float
    matched_count: int
    status: str = Field(description="APPROVED hoặc REJECTED")
    reject_reason: Optional[str] = None
    ensemble_status: Optional[str] = "CONFIRMED"
    xgboost_confidence: Optional[float] = None
    ai_model: Optional[str] = "Hybrid FAISS + XGBoost"
