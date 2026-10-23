"""Script chạy thử nghiệm Realtime Bar Listener với Binance."""
import sys
import signal
from pathlib import Path

# Thêm root directory vào sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from loguru import logger
from src.core.config_loader import load_config
from src.execution.binance_listener import BinanceBarListener
from src.data.binance_loader import BinanceDataLoader


def main():
    config = load_config()
    symbol = config.binance.symbol
    interval = config.binance.interval

    logger.info("=====================================================")
    logger.info(f"KHỞI ĐỘNG REALTIME BINANCE BAR LISTENER TEST: {symbol} [{interval}]")
    logger.info("Nhấn Ctrl+C để dừng chương trình bất cứ lúc nào.")
    logger.info("=====================================================")

    loader = BinanceDataLoader(
        base_url=config.binance.base_url,
        market_type=config.binance.market_type,
        timeout_sec=config.binance.timeout_sec
    )

    listener = BinanceBarListener(
        symbol=symbol,
        interval=interval,
        poll_interval_sec=config.execution.poll_interval_sec,
        data_loader=loader
    )

    def on_bar_closed(df_closed):
        latest = df_closed.iloc[-1]
        logger.success(
            f"🎉 [EVENT TRIGGERED] Nến {symbol} mới đã đóng hoàn tất!\n"
            f"   • Thời gian: {latest['timestamp']}\n"
            f"   • Open:  {latest['open']:,.2f}\n"
            f"   • High:  {latest['high']:,.2f}\n"
            f"   • Low:   {latest['low']:,.2f}\n"
            f"   • Close: {latest['close']:,.2f}\n"
            f"   • Volume: {latest['volume']:,.2f}\n"
            f"   • Số nến sẵn sàng cho Pipeline: {len(df_closed)}"
        )

    def signal_handler(sig, frame):
        logger.warning("Nhận tín hiệu dừng (Ctrl+C). Đang tắt listener an toàn...")
        listener.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)

    try:
        listener.start_listening(callback_on_bar=on_bar_closed)
    except KeyboardInterrupt:
        listener.stop()


if __name__ == "__main__":
    main()
