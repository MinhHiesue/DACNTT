"""Pydantic schemas for FastAPI endpoints."""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "ok"
    uptime_seconds: float
    symbol: str
    timeframe: str
    binance_connected: bool
    pattern_count: int
    min_similarity: float


class KlineItem(BaseModel):
    time: int
    open: float
    high: float
    low: float
    close: float
    volume: float


class KlinesResponse(BaseModel):
    symbol: str
    timeframe: str
    data: List[KlineItem]


class VolumeRegimeResponse(BaseModel):
    current_volume: float
    p20: float
    p85: float
    pass_filter: bool
    reason: str


class TradeSignalResponse(BaseModel):
    id: str
    timestamp: str
    timestamp_unix: int
    symbol: str
    direction: str
    entry_price: float
    stop_loss: float
    take_profit: float
    delta_sl: float
    delta_tp: float
    rr_ratio: float
    suggested_lot: float
    confidence: float
    matched_count: int
    status: str
    reject_reason: Optional[str] = None


class SignalsHistoryResponse(BaseModel):
    total: int
    signals: List[TradeSignalResponse]


class PatternMatchItem(BaseModel):
    id: int
    direction: str
    similarity: float
    max_favorable_move: float
    entry_price: float
    timestamp: str
    normalized_curve: List[float]


class PatternInspectorResponse(BaseModel):
    current_curve: List[float]
    matched_patterns: List[PatternMatchItem]


class PerformanceSummaryResponse(BaseModel):
    total_trades: int
    win_trades: int
    loss_trades: int
    winrate_pct: float
    profit_factor: float
    max_drawdown_pct: float
    max_drawdown_usd: float
    net_profit_usd: float
    final_balance: float
    sharpe_ratio: float
    sortino_ratio: float
    win_loss_ratio: float


class PerformanceTradeItem(BaseModel):
    trade_id: int
    entry_time: str
    direction: str
    entry_price: float
    exit_price: float
    sl_price: float
    tp_price: float
    net_profit: float
    exit_reason: str
    holding_bars: int
    balance_after: float


class PerformanceTradesResponse(BaseModel):
    total: int
    trades: List[PerformanceTradeItem]


class TelegramTestResponse(BaseModel):
    success: bool
    message: str
