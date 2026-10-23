/**
 * Danh sách API Endpoints kết nối tới Signal_Trade Backend (FastAPI).
 */
export const API_BASE = 'http://localhost:8000/api'
export const WS_BASE = 'ws://localhost:8000/ws'

export const ENDPOINTS = {
  HEALTH: `${API_BASE}/health`,
  KLINES: `${API_BASE}/market/klines`,
  VOLUME_REGIME: `${API_BASE}/market/volume-regime`,
  SIGNALS_LATEST: `${API_BASE}/signals/latest`,
  SIGNALS_SCAN: `${API_BASE}/signals/scan`,
  SIGNALS_HISTORY: `${API_BASE}/signals/history`,
  PATTERNS_INSPECTOR: `${API_BASE}/patterns/inspector`,
  PERFORMANCE_SUMMARY: `${API_BASE}/performance/summary`,
  PERFORMANCE_TRADES: `${API_BASE}/performance/trades`,
  TELEGRAM_TEST: `${API_BASE}/telegram/test-alert`,
  WS_LIVE: `${WS_BASE}/live`,
}
