"""Module kết nối Binance Public REST API và tải dữ liệu nến M5."""
import time
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import requests
import pandas as pd
import numpy as np
from loguru import logger

from src.data.sanitizer import DataSanitizer


class BinanceDataLoader:
    """
    Kết nối và tải dữ liệu nến từ Binance Public REST API.
    Không yêu cầu API Key / Secret (100% dữ liệu thị trường công khai).
    """

    def __init__(
        self,
        base_url: str = "https://api.binance.com",
        market_type: str = "spot",
        timeout_sec: float = 10.0
    ):
        self.market_type = market_type
        if market_type == "futures":
            self.base_url = "https://fapi.binance.com"
            self.klines_endpoint = f"{self.base_url}/fapi/v1/klines"
            self.ping_endpoint = f"{self.base_url}/fapi/v1/ping"
        else:
            self.base_url = base_url.rstrip("/")
            self.klines_endpoint = f"{self.base_url}/api/v3/klines"
            self.ping_endpoint = f"{self.base_url}/api/v3/ping"

        self.timeout_sec = timeout_sec
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (compatible; BinancePatternBot/2.0)",
            "Accept": "application/json"
        })

    @property
    def is_connected(self) -> bool:
        """Kiểm tra kết nối mạng tới Binance API."""
        try:
            resp = self.session.get(self.ping_endpoint, timeout=self.timeout_sec)
            return resp.status_code == 200
        except Exception:
            return False

    def ping(self) -> bool:
        """Gửi lệnh ping kiểm tra trạng thái Binance."""
        return self.is_connected

    def _get_endpoint_for_symbol(self, symbol: str) -> str:
        """Tự động phân luồng tới Binance Futures nếu là XAUUSDT hoặc cấu hình futures."""
        if "XAU" in symbol.upper() or self.market_type == "futures":
            return "https://fapi.binance.com/fapi/v1/klines"
        return self.klines_endpoint

    def _parse_klines_to_dataframe(self, raw_klines: List[List[Any]]) -> pd.DataFrame:
        """
        Chuyển đổi danh sách nến trả về từ Binance sang DataFrame chuẩn:
        Index 0: Open time (ms)
        Index 1: Open
        Index 2: High
        Index 3: Low
        Index 4: Close
        Index 5: Volume
        """
        if not raw_klines:
            return pd.DataFrame(columns=['timestamp', 'open', 'high', 'low', 'close', 'volume', 'spread'])

        arr = np.array(raw_klines)
        timestamps = pd.to_datetime(arr[:, 0].astype(np.int64), unit='ms', utc=True)
        opens = arr[:, 1].astype(np.float64)
        highs = arr[:, 2].astype(np.float64)
        lows = arr[:, 3].astype(np.float64)
        closes = arr[:, 4].astype(np.float64)
        volumes = arr[:, 5].astype(np.float64)

        df = pd.DataFrame({
            'timestamp': timestamps,
            'open': opens,
            'high': highs,
            'low': lows,
            'close': closes,
            'volume': volumes,
            'spread': 0.0
        })

        return DataSanitizer.sanitize(df)

    def fetch_recent_bars(
        self,
        symbol: str = "BTCUSDT",
        interval: str = "5m",
        count: int = 105
    ) -> pd.DataFrame:
        """
        Lấy N nến gần nhất từ Binance. Hỗ trợ phân trang mượt mà nếu count > 1000 (tối đa 2000 nến).
        Nến cuối cùng [-1] luôn là nến đang chạy của phiên hiện tại.
        """
        symbol = symbol.upper()
        endpoint = self._get_endpoint_for_symbol(symbol)
        if count <= 1000:
            params = {
                "symbol": symbol,
                "interval": interval,
                "limit": count
            }
            try:
                resp = self.session.get(endpoint, params=params, timeout=self.timeout_sec)
                resp.raise_for_status()
                raw_data = resp.json()
                return self._parse_klines_to_dataframe(raw_data)
            except Exception as e:
                logger.error(f"Lỗi khi tải nến gần nhất từ Binance ({symbol} {interval}): {e}")
                raise
        else:
            try:
                # 1. Tải 1000 nến gần nhất tính đến thời điểm hiện tại
                params = {
                    "symbol": symbol,
                    "interval": interval,
                    "limit": 1000
                }
                resp = self.session.get(endpoint, params=params, timeout=self.timeout_sec)
                resp.raise_for_status()
                recent_klines = resp.json()

                all_klines = []
                remaining = count - len(recent_klines)
                if remaining > 0 and recent_klines:
                    # 2. Lùi về quá khứ từ cây nến sớm nhất của mẻ 1
                    earliest_ts = int(recent_klines[0][0]) - 1
                    past_params = {
                        "symbol": symbol,
                        "interval": interval,
                        "endTime": earliest_ts,
                        "limit": min(remaining, 1000)
                    }
                    past_resp = self.session.get(endpoint, params=past_params, timeout=self.timeout_sec)
                    if past_resp.status_code == 200:
                        past_klines = past_resp.json()
                        all_klines.extend(past_klines)

                all_klines.extend(recent_klines)
                return self._parse_klines_to_dataframe(all_klines)
            except Exception as e:
                logger.error(f"Lỗi khi tải {count} nến từ Binance ({symbol} {interval}): {e}")
                raise

    def fetch_historical_bars(
        self,
        symbol: str = "BTCUSDT",
        interval: str = "5m",
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        total_bars: Optional[int] = None,
        chunk_size: int = 1000
    ) -> pd.DataFrame:
        """
        Tải dữ liệu nến lịch sử lớn từ Binance bằng cách phân trang (pagination).
        """
        symbol = symbol.upper()
        if date_to is None:
            date_to = datetime.utcnow()
        if date_from is None:
            if total_bars:
                # Ước lượng 5 phút mỗi bar
                date_from = date_to - timedelta(minutes=5 * total_bars * 1.2)
            else:
                date_from = date_to - timedelta(days=90) # Mặc định 90 ngày

        start_ts = int(date_from.timestamp() * 1000)
        end_ts = int(date_to.timestamp() * 1000)

        logger.info(
            f"Bắt đầu tải lịch sử Binance: {symbol} [{interval}] "
            f"từ {date_from.strftime('%Y-%m-%d %H:%M')} đến {date_to.strftime('%Y-%m-%d %H:%M')} UTC..."
        )

        all_klines: List[List[Any]] = []
        current_start = start_ts
        endpoint = self._get_endpoint_for_symbol(symbol)

        while current_start < end_ts:
            params = {
                "symbol": symbol,
                "interval": interval,
                "startTime": current_start,
                "endTime": end_ts,
                "limit": chunk_size
            }
            try:
                resp = self.session.get(endpoint, params=params, timeout=self.timeout_sec)
                resp.raise_for_status()
                data = resp.json()
                if not data:
                    break

                all_klines.extend(data)
                last_open_time = int(data[-1][0])

                # Nếu nhận ít hơn limit hoặc đã tới đích
                if len(data) < chunk_size or last_open_time >= end_ts:
                    break

                # Tịnh tiến start_time lên sau nến cuối cùng 1ms
                current_start = last_open_time + 1
                time.sleep(0.05) # Giảm tải rate limit
            except Exception as e:
                logger.error(f"Lỗi phân trang Binance klines tại {current_start}: {e}")
                time.sleep(1.0)
                # Thử lại hoặc ngắt nếu lỗi lặp lại
                break

        df = self._parse_klines_to_dataframe(all_klines)
        logger.success(f"Tải thành công {len(df)} nến lịch sử cho {symbol} từ Binance.")
        return df
