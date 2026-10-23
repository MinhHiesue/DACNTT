"""=====================================================================
BINANCE PATTERN-MATCHING SIGNAL BOT (M5)
Main Application & Central Orchestrator (Signal-Only Alert System)
====================================================================="""
import argparse
import sys
import time
import signal
import threading
from pathlib import Path

# Đảm bảo đường dẫn gốc nhận diện khi chạy
root_dir = Path(__file__).resolve().parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

# Hỗ trợ UTF-8 cho Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from loguru import logger
from src.core.config_loader import load_config
from src.utils.logger import setup_logger
from src.features.volume_filter import VolumeRegimeFilter
from src.features.extractor import FeatureExtractor
from src.engine.similarity_engine import SimilarityEngine
from src.engine.risk_manager import RiskManager
from src.execution.telegram_bot import TelegramNotifier
from src.execution.binance_listener import BinanceBarListener
from src.data.binance_loader import BinanceDataLoader


def start_heartbeat_service(
    telegram_bot: TelegramNotifier,
    binance_loader: BinanceDataLoader,
    symbol: str,
    interval_hours: float = 4.0
):
    """Tiến trình ngầm gửi thông báo trạng thái bot (Heartbeat) định kỳ."""
    def heartbeat_worker():
        start_time = time.time()
        while True:
            time.sleep(interval_hours * 3600)
            uptime_hours = (time.time() - start_time) / 3600.0
            is_connected = binance_loader.is_connected
            status_text = "🟢 Connected (Binance API OK)" if is_connected else "🔴 Disconnected"

            msg = (
                f"💓 <b>[HEARTBEAT - BOT STATUS]</b>\n"
                f"• <b>Symbol:</b> {symbol} M5\n"
                f"• <b>Binance API:</b> {status_text}\n"
                f"• <b>Uptime:</b> {uptime_hours:.1f} giờ\n"
                f"• <i>Hệ thống quét mẫu hình đang giám sát thị trường liên tục.</i>"
            )
            telegram_bot.send_message(msg)

    thread = threading.Thread(target=heartbeat_worker, daemon=True)
    thread.start()


def run_bot(mode: str = "signal"):
    """Khởi chạy vòng lặp giám sát và bắn tín hiệu theo thời gian thực."""
    config = load_config()
    setup_logger(log_level=config.system.log_level, logs_dir=config.paths.logs_dir)

    symbol = config.binance.symbol
    interval = config.binance.interval
    logger.info("=====================================================")
    logger.info(f"🤖 KHỞI ĐỘNG BINANCE PATTERN SIGNAL BOT ({symbol} {interval.upper()})")
    logger.info("• Chế độ hoạt động : [SIGNAL-ONLY / PHÁT TÍN HIỆU CẢNH BÁO]")
    logger.info("• Nguồn dữ liệu     : Binance Public REST & WebSocket")
    logger.info("• Giao dịch thật/demo: TẮT (100% không can thiệp đặt lệnh)")
    logger.info("=====================================================")

    # 1. Khởi tạo các module tính toán
    volume_filter = VolumeRegimeFilter(
        window_size=config.volume_filter.window_size,
        lower_percentile=config.volume_filter.lower_percentile,
        upper_percentile=config.volume_filter.upper_percentile
    )
    feature_extractor = FeatureExtractor(
        window_size=config.feature_extractor.window_size,
        rsi_period=config.feature_extractor.rsi_period,
        vol_zscore_period=config.feature_extractor.vol_zscore_period,
        atr_period=config.feature_extractor.atr_period
    )

    pattern_db_path = Path(config.paths.pattern_db)
    if not pattern_db_path.exists():
        logger.error(f"Không tìm thấy cơ sở dữ liệu mẫu hình tại: {pattern_db_path.resolve()}")
        logger.error("Vui lòng tải dữ liệu và chạy mining trước:")
        logger.error("  1) python scripts/download_data.py")
        logger.error("  2) python main.py --mode mine")
        sys.exit(1)

    similarity_engine = SimilarityEngine(
        parquet_path=pattern_db_path,
        config=config.similarity_engine
    )

    risk_manager = RiskManager(config=config.risk_manager)
    telegram_bot = TelegramNotifier(credentials=config.telegram)
    binance_loader = BinanceDataLoader(
        base_url=config.binance.base_url,
        market_type=config.binance.market_type,
        timeout_sec=config.binance.timeout_sec
    )

    # 2. Kiểm tra kết nối mạng tới Binance
    if not binance_loader.ping():
        logger.warning("Không thể ping tới Binance API. Kiểm tra lại kết nối mạng internet.")
    else:
        logger.success("Kết nối Binance API thành công!")

    # 3. Gửi thông báo khởi động qua Telegram
    telegram_bot.send_message(
        f"🚀 <b>Binance Pattern Signal Bot đã sẵn sàng!</b>\n"
        f"• Cặp giao dịch: <code>{symbol} {interval.upper()}</code>\n"
        f"• Số mẫu hình ký ức: <b>{len(similarity_engine.vectors):,}</b> mẫu\n"
        f"• Ngưỡng tương đồng: <b>{config.similarity_engine.min_similarity*100:.0f}%</b>\n"
        f"• Chế độ: <b>Bắn tín hiệu tự động</b>"
    )

    # 4. Kích hoạt dịch vụ Heartbeat 4h
    start_heartbeat_service(telegram_bot, binance_loader, symbol)

    # 5. Pipeline xử lý khi phát hiện nến M5 đóng cửa
    def on_bar_closed_pipeline(df_closed):
        try:
            latest_time = df_closed.iloc[-1]['timestamp']
            logger.info(f"--- BẮT ĐẦU CHU KỲ PHÂN TÍCH NẾN M5: {latest_time} ---")

            # Bước 1: Kiểm tra Volume Filter (Module 1)
            vol_eval = volume_filter.evaluate_bar(df_closed['volume'].values)
            if not vol_eval.pass_filter:
                logger.info(f"Bỏ qua nến: Volume không hợp lệ ({vol_eval.reason}). Current={vol_eval.current_vol:.0f}, P20={vol_eval.p20:.0f}, P85={vol_eval.p85:.0f}")
                return

            # Bước 2: Trích xuất Feature Vector 49 chiều (Module 2)
            curr_vector = feature_extractor.extract_from_window(df_closed.iloc[-50:])

            # Bước 3: So khớp với Memory Bank (Module 3 & 4)
            match_res = similarity_engine.find_matches(curr_vector)
            if match_res.decision not in ["LONG", "SHORT"]:
                logger.info(f"Không có tín hiệu: {match_res.decision} (Số mẫu khớp: {match_res.total_matches}, Confidence: {match_res.confidence*100:.1f}%)")
                return

            # Bước 4: Thẩm định qua Risk Manager (Module 4 & 5)
            setup_15 = df_closed.iloc[-15:]
            signal = risk_manager.evaluate_signal(
                match_result=match_res,
                setup_bars=setup_15,
                symbol=symbol
            )
            if signal.status != "APPROVED":
                logger.warning(f"Tín hiệu bị từ chối: {signal.reject_reason}")
                return

            logger.success(
                f"🎯 TÍN HIỆU ĐƯỢC PHÊ DUYỆT: {signal.direction} @ {signal.entry_price:,.2f} "
                f"(SL: {signal.stop_loss:,.2f}, TP: {signal.take_profit:,.2f}, R:R {signal.rr_ratio:.2f})"
            )

            # Bước 5: Gửi cảnh báo Telegram kèm ảnh biểu đồ snapshot
            telegram_bot.send_signal_alert(signal, setup_bars=setup_15)

        except Exception as e:
            logger.exception(f"Lỗi ngoại lệ trong pipeline xử lý nến: {e}")

    # 6. Khởi tạo Bar Listener và đăng ký Graceful Shutdown
    listener = BinanceBarListener(
        symbol=symbol,
        interval=interval,
        poll_interval_sec=config.execution.poll_interval_sec,
        data_loader=binance_loader
    )

    def shutdown_handler(sig, frame):
        logger.warning("\nNhận tín hiệu dừng hệ thống (Ctrl+C). Đang tắt an toàn...")
        telegram_bot.send_message(f"🛑 <b>Binance Signal Bot ({symbol}) đã dừng an toàn.</b>")
        listener.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)

    # 7. Bắt đầu lắng nghe
    listener.start_listening(callback_on_bar=on_bar_closed_pipeline)


def main():
    parser = argparse.ArgumentParser(description="Binance Pattern-Matching Signal Bot CLI")
    parser.add_argument(
        "--mode",
        choices=["signal", "mine", "backtest", "download"],
        default="signal",
        help="Bot operation mode: signal (default), mine, backtest, download"
    )
    args = parser.parse_args()

    if args.mode == "download":
        from scripts.download_data import main as download_main
        download_main()
    elif args.mode == "mine":
        from scripts.mine_patterns import main as mine_main
        mine_main()
    elif args.mode == "backtest":
        from scripts.run_backtest import main as backtest_main
        backtest_main()
    elif args.mode == "signal":
        run_bot(mode=args.mode)


if __name__ == "__main__":
    main()
