"""=====================================================================
XAU/USD PATTERN-MATCHING SIGNAL BOT (M5)
Main Application & Central Orchestrator
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
from src.execution.mt5_executor import MT5Executor
from src.execution.mt5_listener import RealtimeBarListener
from src.data.mt5_loader import MT5DataLoader


def start_heartbeat_service(
    telegram_bot: TelegramNotifier,
    mt5_loader: MT5DataLoader,
    symbol: str,
    interval_hours: float = 4.0
):
    """Tiến trình ngầm gửi thông báo trạng thái bot (Heartbeat) định kỳ."""
    def heartbeat_worker():
        start_time = time.time()
        while True:
            time.sleep(interval_hours * 3600)
            uptime_hours = (time.time() - start_time) / 3600.0
            is_connected = mt5_loader.is_connected
            status_text = "🟢 Connected" if is_connected else "🔴 Disconnected"

            msg = (
                f"💓 <b>[HEARTBEAT - BOT STATUS]</b>\n"
                f"• <b>Symbol:</b> {symbol} M5\n"
                f"• <b>MT5 Status:</b> {status_text}\n"
                f"• <b>Uptime:</b> {uptime_hours:.1f} giờ\n"
                f"• <i>Hệ thống vẫn đang giám sát thị trường ổn định.</i>"
            )
            telegram_bot.send_message(msg)

    thread = threading.Thread(target=heartbeat_worker, daemon=True)
    thread.start()


def run_bot(mode: str = "dry-run"):
    """Khởi chạy vòng lặp xử lý chính của Bot ở chế độ dry-run hoặc live."""
    config = load_config()
    setup_logger(log_level=config.system.log_level, logs_dir=config.paths.logs_dir)

    symbol = config.system.symbol
    logger.info("=====================================================")
    logger.info("🤖 KHỞI ĐỘNG XAU/USD PATTERN-MATCHING SIGNAL BOT (M5)")
    logger.info(f"• Chế độ hoạt động : [{mode.upper()}]")
    logger.info(f"• Mã giao dịch     : {symbol}")
    logger.info(f"• Tự động đặt lệnh : {'BẬT (LIVE)' if mode == 'live' and config.execution.auto_trade else 'TẮT (ALERT ONLY)'}")
    logger.info("=====================================================")

    # 1. Khởi tạo các module lõi
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
        logger.error("Vui lòng chạy lệnh: python main.py --mode mine để tạo Memory Bank trước.")
        sys.exit(1)

    similarity_engine = SimilarityEngine(
        parquet_path=pattern_db_path,
        config=config.similarity_engine
    )

    risk_manager = RiskManager(config=config.risk_manager)
    telegram_bot = TelegramNotifier(credentials=config.telegram)
    mt5_executor = MT5Executor(
        magic_number=config.execution.magic_number,
        slippage_points=config.execution.slippage_points
    )

    # 2. Khởi tạo kết nối MT5
    mt5_loader = MT5DataLoader(
        path=config.mt5.path,
        login=config.mt5.login,
        password=config.mt5.password,
        server=config.mt5.server
    )
    mt5_loader.connect()

    # 3. Gửi thông báo khởi động qua Telegram
    telegram_bot.send_message(
        f"🚀 <b>XAU/USD Pattern Bot đã khởi động!</b>\n"
        f"• Chế độ: <code>{mode.upper()}</code>\n"
        f"• Số mẫu hình ký ức: <b>{len(similarity_engine.vectors):,}</b> mẫu\n"
        f"• Ngưỡng tương đồng: <b>{config.similarity_engine.min_similarity*100:.0f}%</b>"
    )

    # 4. Kích hoạt dịch vụ Heartbeat
    start_heartbeat_service(telegram_bot, mt5_loader, symbol)

    # 5. Định nghĩa chuỗi xử lý (Pipeline) khi nến M5 đóng
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
                f"🎯 TÍN HIỆU ĐƯỢC PHÊ DUYỆT: {signal.direction} @ {signal.entry_price:.2f} "
                f"(SL: {signal.stop_loss:.2f}, TP: {signal.take_profit:.2f}, R:R {signal.rr_ratio:.2f})"
            )

            # Bước 5: Gửi cảnh báo Telegram kèm ảnh biểu đồ snapshot
            telegram_bot.send_signal_alert(signal, setup_bars=setup_15)

            # Bước 6: Khớp lệnh MT5 nếu ở chế độ LIVE
            if mode == "live" and config.execution.auto_trade:
                mt5_executor.execute_market_order(signal)

        except Exception as e:
            logger.exception(f"Lỗi ngoại lệ trong pipeline xử lý nến: {e}")

    # 6. Khởi tạo Bar Listener và đăng ký Graceful Shutdown
    listener = RealtimeBarListener(
        symbol=symbol,
        poll_interval_sec=config.execution.poll_interval_sec,
        mt5_loader=mt5_loader
    )

    def shutdown_handler(sig, frame):
        logger.warning("\nNhận tín hiệu dừng hệ thống (Ctrl+C). Đang tắt an toàn...")
        telegram_bot.send_message("🛑 <b>XAU/USD Pattern Bot đã dừng an toàn.</b>")
        listener.stop()
        mt5_loader.disconnect()
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)

    # 7. Bắt đầu lắng nghe
    listener.start_listening(callback_on_bar=on_bar_closed_pipeline)


def main():
    parser = argparse.ArgumentParser(description="XAU/USD M5 Pattern-Matching Signal Bot CLI")
    parser.add_argument(
        "--mode",
        choices=["dry-run", "live", "backtest", "mine"],
        default="dry-run",
        help="Bot operation mode: dry-run (default), live, backtest, mine"
    )
    args = parser.parse_args()

    if args.mode == "mine":
        from scripts.mine_patterns import main as mine_main
        mine_main()
    elif args.mode == "backtest":
        from scripts.run_backtest import main as backtest_main
        backtest_main()
    elif args.mode in ["dry-run", "live"]:
        run_bot(mode=args.mode)


if __name__ == "__main__":
    main()
