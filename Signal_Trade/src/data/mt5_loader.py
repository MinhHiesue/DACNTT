"""Module kết nối MetaTrader 5 API và tải dữ liệu nến M5."""
from datetime import datetime, timedelta
from typing import Optional, Union
import pandas as pd
import MetaTrader5 as mt5
from loguru import logger
from src.data.sanitizer import DataSanitizer


class MT5DataLoader:
    """Kết nối và tải dữ liệu nến lịch sử từ MetaTrader 5 Terminal."""

    def __init__(
        self,
        path: Optional[str] = None,
        login: Optional[int] = None,
        password: Optional[str] = None,
        server: Optional[str] = None
    ):
        self.path = path
        self.login = login
        self.password = password
        self.server = server
        self.is_connected = False

    def connect(self) -> bool:
        """Khởi tạo kết nối với MT5 Terminal."""
        init_kwargs = {}
        if self.path:
            init_kwargs["path"] = self.path
        if self.login:
            init_kwargs["login"] = int(self.login)
        if self.password:
            init_kwargs["password"] = self.password
        if self.server:
            init_kwargs["server"] = self.server

        if not mt5.initialize(**init_kwargs):
            err_code, err_desc = mt5.last_error()
            logger.error(f"Khởi tạo MT5 thất bại! Mã lỗi: {err_code} - {err_desc}")
            self.is_connected = False
            return False

        terminal_info = mt5.terminal_info()
        logger.info(f"Kết nối MT5 thành công! Terminal: {terminal_info.name}, Build: {terminal_info.build}")
        self.is_connected = True
        return True

    def disconnect(self):
        """Đóng kết nối MT5."""
        if self.is_connected:
            mt5.shutdown()
            self.is_connected = False
            logger.info("Đã đóng kết nối MT5.")

    def ensure_symbol(self, symbol: str) -> bool:
        """Đảm bảo symbol được kích hoạt trong Market Watch."""
        if not self.is_connected and not self.connect():
            return False

        selected = mt5.symbol_select(symbol, True)
        if not selected:
            logger.error(f"Không thể chọn symbol '{symbol}' trong Market Watch!")
            return False
        return True

    def fetch_recent_bars(
        self,
        symbol: str,
        timeframe: int = mt5.TIMEFRAME_M5,
        count: int = 105
    ) -> pd.DataFrame:
        """Tải N nến gần nhất tính từ thời điểm hiện tại."""
        if not self.ensure_symbol(symbol):
            raise ConnectionError(f"Không thể kết nối hoặc chọn mã {symbol}")

        rates = mt5.copy_rates_from_pos(symbol, timeframe, 0, count)
        if rates is None or len(rates) == 0:
            err = mt5.last_error()
            raise ValueError(f"Không thể lấy dữ liệu gần nhất cho {symbol}: {err}")

        df = pd.DataFrame(rates)
        df['timestamp'] = pd.to_datetime(df['time'], unit='s', utc=True)
        df.rename(columns={'tick_volume': 'volume'}, inplace=True)
        return DataSanitizer.sanitize(df)

    def fetch_historical_bars(
        self,
        symbol: str,
        timeframe: int = mt5.TIMEFRAME_M5,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        batch_days: int = 30
    ) -> pd.DataFrame:
        """
        Tải dữ liệu nến lịch sử lớn theo từng batch để chống timeout/tràn bộ đệm MT5.
        Mặc định nếu không truyền date_from, tải 1 năm gần nhất tính đến date_to.
        """
        if not self.ensure_symbol(symbol):
            raise ConnectionError(f"Không thể kết nối hoặc chọn mã {symbol}")

        if date_to is None:
            date_to = datetime.utcnow()
        if date_from is None:
            date_from = date_to - timedelta(days=365)

        logger.info(f"Bắt đầu tải nến {symbol} từ {date_from.strftime('%Y-%m-%d')} đến {date_to.strftime('%Y-%m-%d')}...")

        all_dfs = []
        current_start = date_from

        while current_start < date_to:
            current_end = min(current_start + timedelta(days=batch_days), date_to)
            rates = mt5.copy_rates_range(symbol, timeframe, current_start, current_end)

            if rates is not None and len(rates) > 0:
                batch_df = pd.DataFrame(rates)
                batch_df['timestamp'] = pd.to_datetime(batch_df['time'], unit='s', utc=True)
                batch_df.rename(columns={'tick_volume': 'volume'}, inplace=True)
                all_dfs.append(batch_df)
                logger.debug(f"Đã tải {len(batch_df)} nến từ {current_start.date()} đến {current_end.date()}")

            current_start = current_end

        if not all_dfs:
            raise ValueError(f"Không tải được bất kỳ nến nào cho {symbol} trong khoảng thời gian đã chọn.")

        full_df = pd.concat(all_dfs, ignore_index=True)
        logger.info(f"Tổng số nến thô tải về: {len(full_df)}")
        return DataSanitizer.sanitize(full_df)
