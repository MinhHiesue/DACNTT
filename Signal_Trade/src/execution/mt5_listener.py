"""Module 5 (Execution): Giám sát và bắt sự kiện đóng nến M5 Realtime từ MetaTrader 5."""
import time
from datetime import datetime
from typing import Callable, Optional
import pandas as pd
import MetaTrader5 as mt5
from loguru import logger

from src.data.sanitizer import DataSanitizer
from src.data.mt5_loader import MT5DataLoader


class RealtimeBarListener:
    """
    Theo dõi luồng giá trực tiếp từ MT5 và kích hoạt callback khi một nến M5 đóng cửa.
    Đảm bảo:
    - Chống gọi trùng lặp (Deduplication).
    - Xử lý Cold Start (không kích hoạt tín hiệu nến cũ khi mới bật).
    - Tự động phục hồi kết nối MT5 (Auto-reconnect).
    - Dừng tiến trình an toàn (Graceful Shutdown).
    """

    def __init__(
        self,
        symbol: str = "XAUUSD",
        timeframe: int = mt5.TIMEFRAME_M5,
        poll_interval_sec: float = 1.0,
        buffer_bars: int = 105,
        mt5_loader: Optional[MT5DataLoader] = None
    ):
        self.symbol = symbol
        self.timeframe = timeframe
        self.poll_interval_sec = poll_interval_sec
        self.buffer_bars = buffer_bars
        self.mt5_loader = mt5_loader or MT5DataLoader()
        self.last_processed_time: int = 0
        self.is_running: bool = False

    def check_for_closed_bar(self) -> Optional[pd.DataFrame]:
        """
        Kiểm tra đơn lẻ xem có nến M5 mới đóng hay không.
        Trả về DataFrame gồm 100 nến đã đóng nếu có nến mới, ngược lại trả về None.
        Hàm này hỗ trợ chạy đồng bộ và phục vụ unit test.
        """
        # Kiểm tra kết nối MT5
        terminal_info = mt5.terminal_info()
        if terminal_info is None or not terminal_info.connected:
            logger.warning("Mất kết nối với MT5 Terminal. Đang thử kết nối lại...")
            if not self.mt5_loader.connect():
                return None

        rates = mt5.copy_rates_from_pos(self.symbol, self.timeframe, 0, self.buffer_bars)
        if rates is None or len(rates) < 100:
            return None

        # Nến [-1] là nến đang chạy (chưa đóng)
        # Nến [-2] là nến vừa mới đóng cửa hoàn tất
        closed_bar = rates[-2]
        closed_bar_time = int(closed_bar['time'])

        # 1. Xử lý Cold Start: Gán mốc nến hiện tại mà không kích hoạt callback nến cũ
        if self.last_processed_time == 0:
            self.last_processed_time = closed_bar_time
            closed_dt = datetime.utcfromtimestamp(closed_bar_time)
            logger.info(f"Khởi tạo Bar Listener thành công tại nến đóng: {closed_dt.strftime('%Y-%m-%d %H:%M:%S')} UTC")
            return None

        # 2. Phát hiện nến mới vừa đóng
        if closed_bar_time > self.last_processed_time:
            self.last_processed_time = closed_bar_time
            closed_dt = datetime.utcfromtimestamp(closed_bar_time)
            logger.info(f"Phát hiện nến M5 mới vừa đóng: {closed_dt.strftime('%Y-%m-%d %H:%M:%S')} UTC")

            # Lấy toàn bộ các nến đã đóng (bỏ nến đang chạy [-1])
            raw_closed = rates[:-1]
            df_closed = pd.DataFrame(raw_closed)
            df_closed['timestamp'] = pd.to_datetime(df_closed['time'], unit='s', utc=True)
            df_closed.rename(columns={'tick_volume': 'volume'}, inplace=True)

            return DataSanitizer.sanitize(df_closed)

        return None

    def start_listening(
        self,
        callback_on_bar: Callable[[pd.DataFrame], None],
        max_iterations: Optional[int] = None
    ):
        """
        Chạy vòng lặp polling lắng nghe nến mới.
        """
        self.is_running = True
        logger.info(f"Bắt đầu lắng nghe nến M5 cho {self.symbol} (Chu kỳ kiểm tra: {self.poll_interval_sec}s)...")

        iteration = 0
        while self.is_running:
            try:
                closed_df = self.check_for_closed_bar()
                if closed_df is not None and not closed_df.empty:
                    callback_on_bar(closed_df)

            except Exception as e:
                logger.error(f"Lỗi ngoại lệ trong vòng lặp Bar Listener: {e}")

            iteration += 1
            if max_iterations is not None and iteration >= max_iterations:
                logger.info(f"Đã hoàn thành {iteration} chu kỳ polling theo giới hạn.")
                break

            time.sleep(self.poll_interval_sec)

        self.is_running = False
        logger.info("Đã kết thúc vòng lặp Bar Listener.")

    def stop(self):
        """Dừng luồng lắng nghe an toàn."""
        self.is_running = False
        logger.info("Yêu cầu dừng Bar Listener.")
