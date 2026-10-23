"""Module 5: Giám sát và bắt sự kiện đóng nến M5 Realtime từ Binance WebSocket / REST API."""
import json
import time
import threading
from datetime import datetime
from typing import Callable, Optional
import pandas as pd
from loguru import logger

from src.data.binance_loader import BinanceDataLoader
from src.data.sanitizer import DataSanitizer


class BinanceBarListener:
    """
    Theo dõi luồng nến trực tiếp từ Binance và kích hoạt callback khi một nến M5 đóng cửa.
    Hỗ trợ kết hợp:
    1. Realtime WebSocket: Bắt sự kiện nến đóng ngay lập tức (sub-second latency) khi k.x == True.
    2. Fallback REST Polling: Định kỳ kiểm tra nến đóng đảm bảo không bao giờ bỏ sót tín hiệu.
    3. Chống kích hoạt lặp lại (Deduplication).
    4. Xử lý Cold Start an toàn.
    """

    def __init__(
        self,
        symbol: str = "BTCUSDT",
        interval: str = "5m",
        poll_interval_sec: float = 2.0,
        buffer_bars: int = 105,
        data_loader: Optional[BinanceDataLoader] = None,
        use_websocket: bool = True
    ):
        self.symbol = symbol.upper()
        self.interval = interval.lower()
        self.poll_interval_sec = poll_interval_sec
        self.buffer_bars = buffer_bars
        self.data_loader = data_loader or BinanceDataLoader()
        self.use_websocket = use_websocket

        self.last_processed_time: int = 0
        self.is_running: bool = False
        self._lock = threading.Lock()
        self._ws_app = None
        self._ws_thread = None

    def check_for_closed_bar(self) -> Optional[pd.DataFrame]:
        """
        Kiểm tra đơn lẻ qua REST API xem có nến M5 mới đóng hay không.
        Trả về DataFrame gồm các nến đã đóng nếu phát hiện nến mới, ngược lại trả về None.
        Hàm này độc lập, thread-safe và phục vụ unit test.
        """
        try:
            df = self.data_loader.fetch_recent_bars(
                symbol=self.symbol,
                interval=self.interval,
                count=self.buffer_bars
            )
            if df is None or len(df) < 2:
                return None

            # Trong chuỗi trả về từ Binance: nến cuối cùng [-1] là nến đang chạy (chưa đóng)
            # Nến áp chót [-2] là nến vừa mới đóng cửa hoàn tất
            closed_bar = df.iloc[-2]
            closed_bar_time = int(closed_bar['timestamp'].timestamp())

            with self._lock:
                # 1. Xử lý Cold Start: Ghi nhận nến hiện tại mà không kích hoạt xử lý nến cũ
                if self.last_processed_time == 0:
                    self.last_processed_time = closed_bar_time
                    closed_dt = datetime.utcfromtimestamp(closed_bar_time)
                    logger.info(f"Khởi tạo Binance Listener tại nến đóng: {closed_dt.strftime('%Y-%m-%d %H:%M:%S')} UTC")
                    return None

                # 2. Phát hiện nến mới vừa đóng
                if closed_bar_time > self.last_processed_time:
                    self.last_processed_time = closed_bar_time
                    closed_dt = datetime.utcfromtimestamp(closed_bar_time)
                    logger.info(f"Phát hiện nến {self.symbol} [{self.interval}] mới đóng: {closed_dt.strftime('%Y-%m-%d %H:%M:%S')} UTC")

                    # Lấy tất cả các nến đã đóng (bỏ nến đang chạy [-1])
                    df_closed = df.iloc[:-1].copy()
                    return DataSanitizer.sanitize(df_closed)

            return None
        except Exception as e:
            logger.warning(f"Lỗi khi polling kiểm tra nến đóng từ Binance: {e}")
            return None

    def _on_ws_message(self, ws, message, callback_on_bar: Callable[[pd.DataFrame], None]):
        """Xử lý gói tin WebSocket nhận được từ Binance."""
        try:
            data = json.loads(message)
            if "k" not in data:
                return

            k = data["k"]
            is_closed = k.get("x", False) # Nến đã đóng cửa?
            kline_start_ts = int(k.get("t", 0)) // 1000

            if is_closed:
                with self._lock:
                    if kline_start_ts <= self.last_processed_time and self.last_processed_time != 0:
                        return # Đã xử lý nến này rồi

                logger.info(f"⚡ [WebSocket] Nến {self.symbol} [{self.interval}] vừa đóng cửa! Đang nạp dữ liệu...")
                # Lấy buffer nến đã đóng để chuyển tiếp sang pipeline
                closed_df = self.check_for_closed_bar()
                if closed_df is not None and not closed_df.empty:
                    callback_on_bar(closed_df)

        except Exception as e:
            logger.error(f"Lỗi khi giải mã WebSocket Binance: {e}")

    def _run_websocket(self, callback_on_bar: Callable[[pd.DataFrame], None]):
        """Vòng lặp duy trì kết nối WebSocket Binance."""
        import websocket

        stream_name = f"{self.symbol.lower()}@kline_{self.interval}"
        is_futures = (self.data_loader and getattr(self.data_loader, 'market_type', '') == 'futures') or 'XAU' in self.symbol
        ws_base = "wss://fstream.binance.com/ws" if is_futures else "wss://stream.binance.com:9443/ws"
        ws_url = f"{ws_base}/{stream_name}"
        logger.info(f"Đang kết nối tới Binance WebSocket stream: {ws_url}...")

        def on_open(ws):
            logger.success(f"WebSocket Binance kết nối thành công: [{stream_name}]")

        def on_error(ws, error):
            logger.warning(f"Binance WebSocket gặp lỗi: {error}")

        def on_close(ws, close_status_code, close_msg):
            logger.warning(f"Binance WebSocket đã đóng: {close_status_code} - {close_msg}")

        while self.is_running:
            try:
                self._ws_app = websocket.WebSocketApp(
                    ws_url,
                    on_open=on_open,
                    on_message=lambda ws, msg: self._on_ws_message(ws, msg, callback_on_bar),
                    on_error=on_error,
                    on_close=on_close
                )
                self._ws_app.run_forever(ping_interval=20, ping_timeout=10)
            except Exception as e:
                logger.warning(f"Lỗi ngoại lệ WebSocket: {e}. Thử kết nối lại sau 5s...")
            time.sleep(5.0)

    def start_listening(
        self,
        callback_on_bar: Callable[[pd.DataFrame], None],
        max_iterations: Optional[int] = None
    ):
        """
        Bắt đầu tiến trình lắng nghe nến M5 (kết hợp WebSocket + Polling fallback).
        """
        self.is_running = True
        logger.info(f"Bắt đầu lắng nghe tín hiệu {self.symbol} [{self.interval}] từ Binance...")

        # 1. Chạy Cold-Start qua REST để đồng bộ mốc thời gian nến
        self.check_for_closed_bar()

        # 2. Khởi chạy luồng WebSocket nếu được bật
        if self.use_websocket:
            try:
                import websocket
                self._ws_thread = threading.Thread(
                    target=self._run_websocket,
                    args=(callback_on_bar,),
                    daemon=True
                )
                self._ws_thread.start()
            except ImportError:
                logger.warning("Thư viện websocket-client chưa khả dụng. Chuyển hoàn toàn sang Polling.")

        # 3. Vòng lặp Polling đóng vai trò là heartbeat / fallback
        iteration = 0
        while self.is_running:
            try:
                closed_df = self.check_for_closed_bar()
                if closed_df is not None and not closed_df.empty:
                    callback_on_bar(closed_df)

                iteration += 1
                if max_iterations is not None and iteration >= max_iterations:
                    logger.info(f"Đã đạt số lần lặp tối đa ({max_iterations}). Dừng lắng nghe.")
                    self.is_running = False
                    break

                time.sleep(self.poll_interval_sec)
            except Exception as e:
                logger.error(f"Lỗi trong vòng lặp polling: {e}")
                time.sleep(self.poll_interval_sec)

        self.is_running = False

    def stop(self):
        """Dừng tiến trình lắng nghe một cách an toàn."""
        self.is_running = False
        if self._ws_app:
            try:
                self._ws_app.close()
            except Exception:
                pass
        logger.info(f"Đã dừng Binance Bar Listener cho {self.symbol}.")


# Định danh tương thích ngược
RealtimeBarListener = BinanceBarListener
