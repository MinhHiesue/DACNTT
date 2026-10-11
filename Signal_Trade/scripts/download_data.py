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
from src.data.mt5_loader import MT5DataLoader
from src.data.csv_loader import CSVDataLoader
from src.data.storage import save_to_parquet
from src.data.sanitizer import DataSanitizer


def generate_synthetic_data(num_bars: int = 50000, start_price: float = 2300.0) -> pd.DataFrame:
    """Sinh dữ liệu giả lập chuyển động giá Vàng thực tế (Random Walk with Drift) phục vụ dev/test."""
    logger.info(f"Đang sinh {num_bars} nến M5 giả lập cho XAU/USD...")
    np.random.seed(42)

    # 5 phút mỗi bar
    start_time = datetime(2024, 1, 1, 0, 0)
    timestamps = [start_time + timedelta(minutes=5 * i) for i in range(num_bars)]

    # Bước đi ngẫu nhiên
    volatility = 1.2 # Độ lệch chuẩn biến động 5 phút của Vàng (~1.2 USD)
    returns = np.random.normal(0.00001, volatility, num_bars)
    close_prices = start_price + np.cumsum(returns)

    opens = np.roll(close_prices, 1)
    opens[0] = start_price

    # High và Low bao quanh Open và Close
    highs = np.maximum(opens, close_prices) + np.abs(np.random.normal(0.3, 0.5, num_bars))
    lows = np.minimum(opens, close_prices) - np.abs(np.random.normal(0.3, 0.5, num_bars))

    # Volume log-normal
    volumes = np.random.lognormal(mean=5.5, sigma=0.8, size=num_bars).astype(np.float64)
    spreads = np.random.uniform(0.2, 0.4, size=num_bars)

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
    parser = argparse.ArgumentParser(description="Tải và lưu trữ dữ liệu nến M5 XAU/USD")
    parser.add_argument("--source", choices=["mt5", "csv", "synthetic"], default="mt5", help="Nguồn dữ liệu")
    parser.add_argument("--csv-path", type=str, default=None, help="Đường dẫn file CSV nếu dùng source=csv")
    parser.add_argument("--days", type=int, default=365, help="Số ngày lịch sử cần tải (với MT5)")
    parser.add_argument("--output", type=str, default=None, help="Đường dẫn file parquet đầu ra")
    args = parser.parse_args()

    config = load_config()
    output_path = args.output or config.paths.raw_data

    df = None

    if args.source == "mt5":
        logger.info(f"Đang thử kết nối MT5 để tải {args.days} ngày dữ liệu cho {config.system.symbol}...")
        loader = MT5DataLoader(
            path=config.mt5.path,
            login=config.mt5.login,
            password=config.mt5.password,
            server=config.mt5.server
        )

        try:
            if loader.connect():
                date_to = datetime.utcnow()
                date_from = date_to - timedelta(days=args.days)
                df = loader.fetch_historical_bars(config.system.symbol, date_from=date_from, date_to=date_to)
                loader.disconnect()
            else:
                logger.warning("Không thể kết nối MT5 tự động. Chuyển sang phương án dự phòng sinh dữ liệu giả lập (synthetic)...")
                df = generate_synthetic_data(num_bars=int(args.days * 24 * 12 * 0.7)) # ~70% thời gian giao dịch thực
        except Exception as e:
            logger.error(f"Lỗi khi tải từ MT5: {e}. Sử dụng dữ liệu giả lập thay thế.")
            df = generate_synthetic_data(num_bars=int(args.days * 24 * 12 * 0.7))

    elif args.source == "csv":
        if not args.csv_path:
            raise ValueError("Cần chỉ định --csv-path khi chọn --source csv")
        df = CSVDataLoader.load_csv(args.csv_path)

    elif args.source == "synthetic":
        num_bars = int(args.days * 24 * 12 * 0.7)
        df = generate_synthetic_data(num_bars=num_bars)

    if df is not None and not df.empty:
        saved_file = save_to_parquet(df, output_path)
        logger.success(f"Hoàn thành! Đã lưu {len(df)} nến M5 vào: {saved_file.resolve()}")
    else:
        logger.error("Không có dữ liệu để lưu.")


if __name__ == "__main__":
    main()
