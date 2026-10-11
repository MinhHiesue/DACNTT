"""Script chạy thử nghiệm Realtime Bar Listener với MT5."""
import sys
import signal
from pathlib import Path

# Thêm root directory vào sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from loguru import logger
from src.core.config_loader import load_config
from src.execution.mt5_listener import RealtimeBarListener
from src.data.mt5_loader import MT5DataLoader


def main():
    config = load_config()
    symbol = config.system.symbol

    logger.info("=====================================================")
    logger.info(f"KHỞI ĐỘNG REALTIME BAR LISTENER TEST CHO MÃ: {symbol}")
    logger.info("Nhấn Ctrl+C để dừng chương trình bất cứ lúc nào.")
    logger.info("=====================================================")

    loader = MT5DataLoader(
        path=config.mt5.path,
        login=config.mt5.login,
        password=config.mt5.password,
        server=config.mt5.server
    )

    listener = RealtimeBarListener(
        symbol=symbol,
        poll_interval_sec=config.execution.poll_interval_sec,
        mt5_loader=loader
    )

    def on_bar_closed(df_closed):
        latest = df_closed.iloc[-1]
        logger.success(
            f"🎉 [EVENT TRIGGERED] Nến M5 mới đã đóng hoàn tất!\n"
            f"   • Thời gian: {latest['timestamp']}\n"
            f"   • Open:  {latest['open']:.2f}\n"
            f"   • High:  {latest['high']:.2f}\n"
            f"   • Low:   {latest['low']:.2f}\n"
            f"   • Close: {latest['close']:.2f}\n"
            f"   • Volume: {latest['volume']:.0f}\n"
            f"   • Số nến sẵn sàng cho Pipeline: {len(df_closed)}"
        )

    def signal_handler(sig, frame):
        logger.warning("Nhận tín hiệu dừng (Ctrl+C). Đang tắt listener an toàn...")
        listener.stop()
        loader.disconnect()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)

    try:
        listener.start_listening(callback_on_bar=on_bar_closed)
    except KeyboardInterrupt:
        listener.stop()


if __name__ == "__main__":
    main()
