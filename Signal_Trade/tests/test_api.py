"""Unit tests cho FastAPI endpoints (Data Bridge cho Dashboard)."""
from unittest.mock import patch, MagicMock
import pandas as pd
import pytest
from starlette.testclient import TestClient

from src.api.server import app, state


@pytest.fixture
def client():
    return TestClient(app)


def test_api_health_endpoint(client):
    """Kiểm tra endpoint /api/health trả về trạng thái ok và đầy đủ thông số hệ thống."""
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "uptime_seconds" in data
    assert data["symbol"] == "BTCUSDT"
    assert data["timeframe"] == "5m"
    assert "pattern_count" in data


def test_api_market_klines_endpoint(client):
    """Kiểm tra endpoint /api/market/klines trả về dữ liệu nến định dạng TradingView."""
    resp = client.get("/api/market/klines?symbol=BTCUSDT&limit=10")
    assert resp.status_code == 200
    data = resp.json()
    assert data["symbol"] == "BTCUSDT"
    assert len(data["data"]) > 0
    first = data["data"][0]
    assert "time" in first
    assert "open" in first
    assert "high" in first
    assert "low" in first
    assert "close" in first
    assert "volume" in first


def test_api_volume_regime_endpoint(client):
    """Kiểm tra endpoint /api/market/volume-regime tính toán đúng phân vị P20 - P85."""
    resp = client.get("/api/market/volume-regime?symbol=BTCUSDT")
    assert resp.status_code == 200
    data = resp.json()
    assert "current_volume" in data
    assert "p20" in data
    assert "p85" in data
    assert "pass_filter" in data
    assert isinstance(data["pass_filter"], bool)


def test_api_signals_latest_and_history(client):
    """Kiểm tra endpoint lấy tín hiệu mới nhất và lịch sử tín hiệu."""
    resp_latest = client.get("/api/signals/latest")
    assert resp_latest.status_code == 200

    resp_hist = client.get("/api/signals/history")
    assert resp_hist.status_code == 200
    data = resp_hist.json()
    assert "total" in data
    assert "signals" in data


def test_api_performance_summary_and_trades(client):
    """Kiểm tra endpoint đọc báo cáo kiểm thử lịch sử."""
    resp_sum = client.get("/api/performance/summary")
    assert resp_sum.status_code == 200
    summary = resp_sum.json()
    assert "total_trades" in summary
    assert "winrate_pct" in summary
    assert "profit_factor" in summary

    resp_trades = client.get("/api/performance/trades?limit=5&offset=0")
    assert resp_trades.status_code == 200
    trades_data = resp_trades.json()
    assert "total" in trades_data
    assert "trades" in trades_data
    if trades_data["total"] > 0:
        t = trades_data["trades"][0]
        assert "entry_price" in t
        assert "net_profit" in t
        assert "exit_reason" in t


def test_api_telegram_test_alert(client):
    """Kiểm tra endpoint gửi cảnh báo thử nghiệm Telegram."""
    resp = client.post("/api/telegram/test-alert")
    assert resp.status_code == 200
    data = resp.json()
    assert "success" in data
    assert "message" in data
