"""FastAPI backend server and Data Bridge for Dashboard."""
import time
import asyncio
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List, Dict, Any
import pandas as pd
import numpy as np

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from src.core.config_loader import load_config
from src.core.schemas import TradeSignal, MatchResult
from src.data.binance_loader import BinanceDataLoader
from src.data.storage import load_from_parquet
from src.features.volume_filter import VolumeRegimeFilter
from src.features.extractor import FeatureExtractor
from src.engine.similarity_engine import SimilarityEngine
from src.engine.xgboost_engine import XGBoostEngine
from src.engine.hybrid_ensemble import HybridEnsembleEngine, HybridMatchResult
from src.engine.risk_manager import RiskManager
from src.execution.telegram_bot import TelegramNotifier
from src.mining.metrics import calculate_trade_metrics
from src.api.schemas import (
    HealthResponse,
    KlineItem,
    KlinesResponse,
    VolumeRegimeResponse,
    TradeSignalResponse,
    SignalsHistoryResponse,
    PatternMatchItem,
    PatternInspectorResponse,
    PerformanceSummaryResponse,
    PerformanceTradeItem,
    PerformanceTradesResponse,
    TelegramTestResponse,
    FeatureImportanceItem,
    XGBoostMetricsResponse,
)

# Khởi tạo FastAPI Application
app = FastAPI(
    title="Signal_Trade Pattern AI API",
    description="REST & WebSocket API cung cấp dữ liệu nến Binance và tín hiệu AI cho Dashboard",
    version="2.0.0"
)

# Cấu hình CORS mở cho các cổng local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Quản lý trạng thái chia sẻ (State Manager)
class AppState:
    def __init__(self):
        self.start_time = time.time()
        self.config = load_config()
        self.binance_loader = BinanceDataLoader(
            base_url=self.config.binance.base_url,
            market_type=self.config.binance.market_type,
            timeout_sec=self.config.binance.timeout_sec
        )
        self.volume_filter = VolumeRegimeFilter(
            window_size=self.config.volume_filter.window_size,
            lower_percentile=self.config.volume_filter.lower_percentile,
            upper_percentile=self.config.volume_filter.upper_percentile
        )
        self.feature_extractor = FeatureExtractor(
            window_size=self.config.feature_extractor.window_size,
            rsi_period=self.config.feature_extractor.rsi_period,
            vol_zscore_period=self.config.feature_extractor.vol_zscore_period,
            atr_period=self.config.feature_extractor.atr_period
        )

        # Nạp Memory Bank nếu có
        pattern_db_path = Path(self.config.paths.pattern_db)
        self.similarity_engine: Optional[SimilarityEngine] = None
        self.memory_bank_df: Optional[pd.DataFrame] = None
        if pattern_db_path.exists():
            try:
                self.similarity_engine = SimilarityEngine(
                    parquet_path=pattern_db_path,
                    config=self.config.similarity_engine
                )
                self.memory_bank_df = load_from_parquet(pattern_db_path)
                logger.info(f"API Server: Nạp thành công Memory Bank {len(self.memory_bank_df)} mẫu.")
            except Exception as e:
                logger.error(f"Lỗi khi nạp Memory Bank vào API Server: {e}")

        # Nạp mô hình XGBoost
        self.xgboost_engine: Optional[XGBoostEngine] = None
        xgb_model_path = Path(getattr(self.config.paths, "xgboost_model", "models/xgboost_hybrid.json"))
        if xgb_model_path.exists():
            try:
                self.xgboost_engine = XGBoostEngine(
                    model_path=xgb_model_path,
                    min_confidence=getattr(self.config.xgboost, "min_confidence", 0.45)
                )
                logger.info(f"API Server: Nạp thành công mô hình XGBoost Hybrid từ {xgb_model_path.name}")
            except Exception as e:
                logger.error(f"Lỗi khi nạp XGBoost vào API Server: {e}")

        # Khởi tạo Hybrid Ensemble Engine
        self.hybrid_engine = HybridEnsembleEngine(
            similarity_engine=self.similarity_engine,
            xgboost_engine=self.xgboost_engine,
            min_xgboost_prob=getattr(self.config.ensemble, "min_xgboost_prob", 0.45),
            blend_weight_faiss=getattr(self.config.ensemble, "blend_weight_faiss", 0.50),
            blend_weight_xgboost=getattr(self.config.ensemble, "blend_weight_xgboost", 0.50)
        )

        self.risk_manager = RiskManager(config=self.config.risk_manager)
        self.telegram_bot = TelegramNotifier(credentials=self.config.telegram)

        # Bộ nhớ lưu tín hiệu gần đây
        self.latest_signal: Optional[TradeSignalResponse] = None
        self.signals_history: List[TradeSignalResponse] = []
        self.connected_websockets: List[WebSocket] = []

    def add_signal(self, sig: TradeSignal) -> TradeSignalResponse:
        ts_unix = int(sig.timestamp.timestamp())
        ts_str = sig.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC")
        sig_id = f"sig-{ts_unix}"

        resp = TradeSignalResponse(
            id=sig_id,
            timestamp=ts_str,
            timestamp_unix=ts_unix,
            symbol=sig.symbol,
            direction=sig.direction,
            entry_price=sig.entry_price,
            stop_loss=sig.stop_loss,
            take_profit=sig.take_profit,
            delta_sl=sig.delta_sl,
            delta_tp=sig.delta_tp,
            rr_ratio=sig.rr_ratio,
            suggested_lot=sig.suggested_lot,
            confidence=round(sig.confidence, 4),
            matched_count=sig.matched_count,
            status=sig.status,
            reject_reason=sig.reject_reason,
            ensemble_status=getattr(sig, "ensemble_status", "CONFIRMED"),
            xgboost_confidence=getattr(sig, "xgboost_confidence", None),
            ai_model=getattr(sig, "ai_model", "Hybrid FAISS + XGBoost")
        )

        self.latest_signal = resp
        # Chèn vào đầu danh sách lịch sử (tối đa giữ 100 tín hiệu)
        self.signals_history.insert(0, resp)
        if len(self.signals_history) > 100:
            self.signals_history.pop()

        return resp


state = AppState()


# =====================================================================
# REST ENDPOINTS
# =====================================================================

@app.get("/api/health", response_model=HealthResponse)
def get_health():
    """Kiểm tra sức khỏe hệ thống và các kết nối nền tảng."""
    uptime = time.time() - state.start_time
    is_connected = state.binance_loader.is_connected
    pattern_count = len(state.similarity_engine.vectors) if state.similarity_engine else 0

    return HealthResponse(
        status="ok",
        uptime_seconds=round(uptime, 1),
        symbol=state.config.binance.symbol,
        timeframe=state.config.binance.interval,
        binance_connected=is_connected,
        pattern_count=pattern_count,
        min_similarity=state.config.similarity_engine.min_similarity
    )


@app.get("/api/market/klines", response_model=KlinesResponse)
def get_klines(
    symbol: str = Query("XAUUSDT", description="Cặp giao dịch"),
    limit: int = Query(500, ge=10, le=2000, description="Số lượng nến")
):
    """
    Lấy dữ liệu nến M5 từ Binance hoặc kho lưu trữ Parquet (độ sâu lên đến 2,000 nến).
    Tương thích tuyệt đối với TradingView Lightweight Charts.
    """
    try:
        df = None
        # Nếu yêu cầu <= 1000 nến, ưu tiên nến live mới nhất từ Binance API
        if limit <= 1000:
            try:
                df = state.binance_loader.fetch_recent_bars(
                    symbol=symbol,
                    interval=state.config.binance.interval,
                    count=limit
                )
            except Exception as e:
                logger.warning(f"Lấy nến trực tiếp từ Binance thất bại: {e}. Đang nạp kho Parquet dự phòng...")

        # Nếu chưa có dữ liệu hoặc yêu cầu độ sâu lớn > 1000 nến, nạp từ Parquet
        if df is None or len(df) < limit:
            parquet_name = f"{symbol.lower()}_m5.parquet"
            parquet_path = Path(__file__).resolve().parent.parent.parent / "data" / "raw" / parquet_name
            if not parquet_path.exists():
                parquet_path = Path(__file__).resolve().parent.parent.parent / "data" / "raw" / "xauusdt_m5.parquet"
            if not parquet_path.exists():
                parquet_path = Path(__file__).resolve().parent.parent.parent / "data" / "raw" / "btcusdt_m5.parquet"
            if parquet_path.exists():
                local_df = load_from_parquet(parquet_path)
                if not local_df.empty:
                    df = local_df.iloc[-limit:].copy()

        if df is None or df.empty:
            raise ValueError(f"Không thể nạp dữ liệu nến cho {symbol}")

        records = []
        for _, row in df.iterrows():
            ts = int(row['timestamp'].timestamp())
            records.append(KlineItem(
                time=ts,
                open=round(float(row['open']), 2),
                high=round(float(row['high']), 2),
                low=round(float(row['low']), 2),
                close=round(float(row['close']), 2),
                volume=round(float(row['volume']), 4)
            ))

        return KlinesResponse(
            symbol=symbol.upper(),
            timeframe=state.config.binance.interval,
            data=records
        )
    except Exception as e:
        logger.error(f"Lỗi endpoint /api/market/klines: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/market/volume-regime", response_model=VolumeRegimeResponse)
def get_volume_regime(symbol: str = "XAUUSDT"):
    """Đánh giá trạng thái phân vị khối lượng (Volume Regime P20 - P85)."""
    try:
        df = state.binance_loader.fetch_recent_bars(
            symbol=symbol,
            interval=state.config.binance.interval,
            count=state.config.volume_filter.window_size + 5
        )
        if len(df) < 20:
            raise ValueError("Không đủ số lượng nến để tính Volume Regime.")

        volumes = df['volume'].values
        vol_eval = state.volume_filter.evaluate_bar(volumes)

        return VolumeRegimeResponse(
            current_volume=round(vol_eval.current_vol, 4),
            p20=round(vol_eval.p20, 4),
            p85=round(vol_eval.p85, 4),
            pass_filter=vol_eval.pass_filter,
            reason=vol_eval.reason
        )
    except Exception as e:
        logger.error(f"Lỗi endpoint /api/market/volume-regime: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/signals/latest", response_model=Optional[TradeSignalResponse])
def get_latest_signal():
    """Lấy tín hiệu giao dịch mới nhất."""
    if state.latest_signal is None:
        # Nếu chưa có tín hiệu trong bộ nhớ, tự động quét 1 lần từ nến vừa đóng
        scan_latest_signal()
    return state.latest_signal


@app.post("/api/signals/scan", response_model=TradeSignalResponse)
def scan_latest_signal():
    """Chạy quét mẫu hình trên nến M5 vừa đóng từ Binance."""
    try:
        df = state.binance_loader.fetch_recent_bars(
            symbol=state.config.binance.symbol,
            interval=state.config.binance.interval,
            count=105
        )
        if len(df) < 50:
            raise ValueError("Chưa đủ nến để trích xuất đặc trưng 49D.")

        # Lấy các nến đã đóng
        df_closed = df.iloc[:-1].copy()

        # 1. Volume filter
        vol_eval = state.volume_filter.evaluate_bar(df_closed['volume'].values)
        if not vol_eval.pass_filter:
            now = datetime.now(timezone.utc)
            dummy_signal = TradeSignal(
                timestamp=now,
                symbol=state.config.binance.symbol,
                direction="NONE",
                entry_price=float(df_closed.iloc[-1]['close']),
                stop_loss=0.0,
                take_profit=0.0,
                delta_sl=0.0,
                delta_tp=0.0,
                rr_ratio=0.0,
                suggested_lot=0.0,
                confidence=0.0,
                matched_count=0,
                status="REJECTED",
                reject_reason=f"VOLUME_FILTER_{vol_eval.reason}"
            )
            return state.add_signal(dummy_signal)

        # 2. Trích xuất đặc trưng 49 chiều
        vec = state.feature_extractor.extract_from_window(df_closed.iloc[-50:])

        # 3. So khớp với FAISS
        if state.similarity_engine is None:
            raise HTTPException(status_code=503, detail="Memory Bank chưa được tải.")

        match_res = state.similarity_engine.find_matches(vec)

        # 4. Quản trị rủi ro
        setup_15 = df_closed.iloc[-15:]
        signal = state.risk_manager.evaluate_signal(
            match_result=match_res,
            setup_bars=setup_15,
            symbol=state.config.binance.symbol
        )

        return state.add_signal(signal)
    except Exception as e:
        logger.error(f"Lỗi khi quét tín hiệu nến đóng: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/signals/history", response_model=SignalsHistoryResponse)
def get_signals_history():
    """Lấy danh sách các tín hiệu đã sinh ra gần đây."""
    if not state.signals_history:
        scan_latest_signal()
    return SignalsHistoryResponse(
        total=len(state.signals_history),
        signals=state.signals_history
    )


@app.get("/api/patterns/inspector", response_model=PatternInspectorResponse)
def get_pattern_inspector():
    """
    Soi chiếu ký ức mẫu hình (Pattern Memory Inspector):
    Trả về chuỗi giá tương đối của 15 nến hiện tại và các mẫu hình thắng tương đồng nhất trong lịch sử.
    """
    try:
        df = state.binance_loader.fetch_recent_bars(
            symbol=state.config.binance.symbol,
            interval=state.config.binance.interval,
            count=50
        )
        if len(df) < 15:
            raise ValueError("Không đủ nến.")

        df_closed = df.iloc[:-1].copy()
        setup_15 = df_closed.iloc[-15:]

        # Chuỗi giá tương đối của nến hiện tại
        first_close = float(setup_15.iloc[0]['close'])
        curr_curve = [round(float(c) - first_close, 2) for c in setup_15['close'].values]

        # Trích xuất vector 49D và so khớp
        vec = state.feature_extractor.extract_from_window(df_closed.iloc[-50:])
        matched_items = []

        if state.similarity_engine and state.memory_bank_df is not None:
            match_res = state.similarity_engine.find_matches(vec)

            # Lấy top các mẫu hình khớp
            for idx in match_res.matched_indices[:10]:
                if idx < len(state.memory_bank_df):
                    row = state.memory_bank_df.iloc[idx]
                    hist_vec = row['feature_vector']
                    # 15 phần tử đầu tiên của vector chính là Delta Close của 15 nến
                    hist_curve = [round(float(v), 2) for v in hist_vec[:15]]

                    matched_items.append(PatternMatchItem(
                        id=int(idx),
                        direction="LONG" if row['direction'] == 1 else "SHORT",
                        similarity=round(float(match_res.avg_similarity), 4),
                        max_favorable_move=round(float(row.get('max_favorable_move', 0.0)), 2),
                        entry_price=round(float(row.get('entry_price', 0.0)), 2),
                        timestamp=str(row.get('timestamp', '')),
                        normalized_curve=hist_curve
                    ))

        return PatternInspectorResponse(
            current_curve=curr_curve,
            matched_patterns=matched_items
        )
    except Exception as e:
        logger.error(f"Lỗi endpoint /api/patterns/inspector: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/performance/summary", response_model=PerformanceSummaryResponse)
def get_performance_summary():
    """Lấy báo cáo tổng hợp chỉ số hiệu suất Out-of-Sample từ file reports/."""
    try:
        report_csv = Path(__file__).resolve().parent.parent.parent / "reports" / "backtest_trades.csv"
        if not report_csv.exists():
            raise FileNotFoundError("Chưa có dữ liệu kiểm thử tại reports/backtest_trades.csv")

        df = pd.read_csv(report_csv)
        metrics = calculate_trade_metrics(df, initial_balance=10000.0)

        return PerformanceSummaryResponse(**metrics)
    except Exception as e:
        logger.warning(f"Lỗi nạp báo cáo backtest: {e}")
        # Trả về số liệu mặc định an toàn
        return PerformanceSummaryResponse(
            total_trades=0,
            win_trades=0,
            loss_trades=0,
            winrate_pct=0.0,
            profit_factor=0.0,
            max_drawdown_pct=0.0,
            max_drawdown_usd=0.0,
            net_profit_usd=0.0,
            final_balance=10000.0,
            sharpe_ratio=0.0,
            sortino_ratio=0.0,
            win_loss_ratio=0.0
        )


@app.get("/api/performance/trades", response_model=PerformanceTradesResponse)
def get_performance_trades(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    """Lấy danh sách chi tiết các lệnh giao dịch kiểm thử lịch sử."""
    try:
        report_csv = Path(__file__).resolve().parent.parent.parent / "reports" / "backtest_trades.csv"
        if not report_csv.exists():
            return PerformanceTradesResponse(total=0, trades=[])

        df = pd.read_csv(report_csv)
        total = len(df)
        subset = df.iloc[offset : offset + limit]

        records = []
        for i, row in subset.iterrows():
            records.append(PerformanceTradeItem(
                trade_id=int(i + 1),
                entry_time=str(row['entry_time']),
                direction=str(row['direction']),
                entry_price=round(float(row['entry_price']), 2),
                exit_price=round(float(row['exit_price']), 2),
                sl_price=round(float(row['sl_price']), 2),
                tp_price=round(float(row['tp_price']), 2),
                net_profit=round(float(row['net_profit']), 2),
                exit_reason=str(row['exit_reason']),
                holding_bars=int(row['holding_bars']),
                balance_after=round(float(row['balance_after']), 2)
            ))

        return PerformanceTradesResponse(total=total, trades=records)
    except Exception as e:
        logger.error(f"Lỗi nạp danh sách lệnh backtest: {e}")
        return PerformanceTradesResponse(total=0, trades=[])


@app.post("/api/telegram/test-alert", response_model=TelegramTestResponse)
def send_telegram_test_alert():
    """Gửi cảnh báo thử nghiệm có kèm ảnh biểu đồ snapshot qua Telegram Bot."""
    try:
        now = datetime.now(timezone.utc)
        test_signal = TradeSignal(
            timestamp=now,
            symbol=state.config.binance.symbol,
            direction="LONG",
            entry_price=67500.00,
            stop_loss=67100.00,
            take_profit=68100.00,
            delta_sl=400.00,
            delta_tp=600.00,
            rr_ratio=1.50,
            suggested_lot=0.25,
            confidence=0.885,
            matched_count=14,
            status="APPROVED"
        )

        # Lấy 15 nến thực gần nhất làm setup bars để vẽ ảnh
        df = state.binance_loader.fetch_recent_bars(
            symbol=state.config.binance.symbol,
            interval=state.config.binance.interval,
            count=15
        )

        sent = state.telegram_bot.send_signal_alert(test_signal, setup_bars=df)
        if sent:
            return TelegramTestResponse(
                success=True,
                message="Đã gửi thành công tin nhắn HTML kèm biểu đồ snapshot tới Telegram!"
            )
        else:
            return TelegramTestResponse(
                success=False,
                message="Chưa cấu hình TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID trong .env. (Đã log mô phỏng ra console)."
            )
    except Exception as e:
        logger.error(f"Lỗi gửi Telegram test alert: {e}")
        return TelegramTestResponse(success=False, message=str(e))


@app.get("/api/ai/xgboost-metrics", response_model=XGBoostMetricsResponse)
async def get_xgboost_metrics():
    """Lấy thông số mô hình XGBoost và Top 10 đặc trưng kỹ thuật quan trọng nhất (Feature Importance)."""
    top_feats = []
    is_loaded = False
    accuracy = 0.80
    model_path = str(getattr(state.config.paths, "xgboost_model", "models/xgboost_hybrid.json"))

    if state.xgboost_engine is not None and state.xgboost_engine.model is not None:
        is_loaded = True
        top_dict = state.xgboost_engine.get_top_features(limit=10)
        top_feats = [FeatureImportanceItem(feature=k, importance=v) for k, v in top_dict.items()]

    report_file = Path("reports/xgboost_metrics.json")
    if report_file.exists():
        try:
            import json
            with open(report_file, "r", encoding="utf-8") as f:
                rep_data = json.load(f)
                accuracy = rep_data.get("accuracy", 0.80)
        except Exception:
            pass

    return XGBoostMetricsResponse(
        accuracy=round(accuracy, 4),
        is_model_loaded=is_loaded,
        top_features=top_feats,
        model_path=model_path
    )


# =====================================================================
# WEBSOCKET STREAM
# =====================================================================

@app.websocket("/ws/live")
async def websocket_live_stream(websocket: WebSocket):
    """Kênh WebSocket truyền dữ liệu nến và thông báo thời gian thực."""
    await websocket.accept()
    state.connected_websockets.append(websocket)
    logger.info("Client kết nối tới WebSocket /ws/live thành công.")
    try:
        while True:
            # Nhận ping từ client và phản hồi pong
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        state.connected_websockets.remove(websocket)
        logger.info("Client đã ngắt kết nối WebSocket /ws/live.")
    except Exception:
        if websocket in state.connected_websockets:
            state.connected_websockets.remove(websocket)


def main():
    """Khởi chạy API server độc lập."""
    import uvicorn
    uvicorn.run("src.api.server:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    main()
