"""Script tải và lưu trữ dữ liệu nến lịch sử từ Binance Public API."""
import argparse
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Đảm bảo đường dẫn gốc được nhận diện khi chạy trực tiếp
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

import numpy as np
import pandas as pd
from loguru import logger
from src.core.config_loader import load_config
from src.data.binance_loader import BinanceDataLoader
from src.data.csv_loader import CSVDataLoader
from src.data.storage import save_to_parquet
from src.data.sanitizer import DataSanitizer


def generate_synthetic_data(num_bars: int = 50000, start_price: float = 65000.0) -> pd.DataFrame:
    """Sinh dữ liệu giả lập chuyển động giá thực tế (Random Walk with Drift) phục vụ dev/test."""
    logger.info(f"Đang sinh {num_bars} nến M5 giả lập cho BTCUSDT...")
    np.random.seed(42)

    start_time = datetime(2024, 1, 1, 0, 0)
    timestamps = [start_time + timedelta(minutes=5 * i) for i in range(num_bars)]

    volatility = 45.0 # Độ lệch chuẩn biến động 5 phút của BTC (~$45)
    returns = np.random.normal(0.00002, volatility, num_bars)
    close_prices = start_price + np.cumsum(returns)

    opens = np.roll(close_prices, 1)
    opens[0] = start_price

    highs = np.maximum(opens, close_prices) + np.abs(np.random.normal(15.0, 10.0, num_bars))
    lows = np.minimum(opens, close_prices) - np.abs(np.random.normal(15.0, 10.0, num_bars))

    volumes = np.random.lognormal(mean=4.0, sigma=0.8, size=num_bars).astype(np.float64)
    spreads = np.random.uniform(0.1, 0.5, size=num_bars)

    df = pd.DataFrame({
        'timestamp': pd.to_datetime(timestamps, utc=True),
        'open': opens,
        'high': highs,
        'low': lows,
        'close': close_prices,
        'volume': volumes,
        'spread': spreads
    })

    return DataSanitizer.sanitize(df)


def main():
    parser = argparse.ArgumentParser(description="Tải và lưu trữ dữ liệu nến M5 từ Binance")
    parser.add_argument("--source", choices=["binance", "csv", "synthetic"], default="binance", help="Nguồn dữ liệu")
    parser.add_argument("--symbol", type=str, default=None, help="Mã giao dịch (BTCUSDT, ETHUSDT, ...)")
    parser.add_argument("--interval", type=str, default="5m", help="Khung thời gian (5m, 15m, ...)")
    parser.add_argument("--days", type=int, default=90, help="Số ngày lịch sử cần tải từ Binance")
    parser.add_argument("--csv-path", type=str, default=None, help="Đường dẫn file CSV nếu dùng source=csv")
    parser.add_argument("--output", type=str, default=None, help="Đường dẫn file parquet đầu ra")
    args = parser.parse_args()

    config = load_config()
    symbol = (args.symbol or config.binance.symbol).upper()
    interval = args.interval or config.binance.interval
    output_path = args.output or config.paths.raw_data

    df = None

    if args.source == "binance":
        logger.info(f"Đang tải {args.days} ngày nến {symbol} [{interval}] trực tiếp từ Binance Public API...")
        loader = BinanceDataLoader(
            base_url=config.binance.base_url,
            market_type=config.binance.market_type,
            timeout_sec=config.binance.timeout_sec
        )

        try:
            date_to = datetime.utcnow()
            date_from = date_to - timedelta(days=args.days)
            df = loader.fetch_historical_bars(symbol=symbol, interval=interval, date_from=date_from, date_to=date_to)
        except Exception as e:
            logger.error(f"Lỗi khi tải từ Binance: {e}. Chuyển sang dữ liệu giả lập dự phòng.")
            num_bars = int(args.days * 24 * 12)
            df = generate_synthetic_data(num_bars=num_bars)

    elif args.source == "csv":
        if not args.csv_path:
            raise ValueError("Cần chỉ định --csv-path khi chọn --source csv")
        df = CSVDataLoader.load_csv(args.csv_path)

    elif args.source == "synthetic":
        num_bars = int(args.days * 24 * 12)
        df = generate_synthetic_data(num_bars=num_bars)

    if df is not None and not df.empty:
        save_to_parquet(df, output_path)
        logger.success(f"Đã lưu thành công {len(df)} nến vào: {output_path}")
        logger.info(f"Khoảng thời gian: từ {df['timestamp'].min()} đến {df['timestamp'].max()} UTC")
    else:
        logger.error("Không có dữ liệu nào được trích xuất!")


if __name__ == "__main__":
    main()
