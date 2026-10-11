"""Bộ kiểm tra và làm sạch dữ liệu nến (Data Sanitizer)."""
import pandas as pd
import numpy as np
from loguru import logger


class DataSanitizer:
    """Kiểm tra và chuẩn hóa tính toàn vẹn của dữ liệu nến OHLCV."""

    @staticmethod
    def sanitize(df: pd.DataFrame, drop_invalid: bool = True) -> pd.DataFrame:
        """
        Làm sạch DataFrame nến:
        1. Kiểm tra các cột bắt buộc: timestamp, open, high, low, close, volume.
        2. Ép kiểu chuẩn: timestamp (UTC), các cột giá (float64), volume (float64).
        3. Loại bỏ trùng lặp timestamp.
        4. Sắp xếp tăng dần theo thời gian.
        5. Kiểm tra tính hợp lệ hình học giá: High >= Low, High >= max(Open, Close), Low <= min(Open, Close).
        """
        if df.empty:
            logger.warning("DataFrame rỗng, không thể làm sạch.")
            return df.copy()

        df = df.copy()

        # 1. Kiểm tra cột bắt buộc
        required_cols = ['timestamp', 'open', 'high', 'low', 'close', 'volume']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise ValueError(f"Thiếu các cột bắt buộc trong dữ liệu: {missing_cols}")

        if 'spread' not in df.columns:
            df['spread'] = 0.0

        # 2. Chuẩn hóa múi giờ sang UTC
        if not pd.api.types.is_datetime64_any_dtype(df['timestamp']):
            df['timestamp'] = pd.to_datetime(df['timestamp'], utc=True)
        elif df['timestamp'].dt.tz is None:
            df['timestamp'] = df['timestamp'].dt.tz_localize('UTC')
        else:
            df['timestamp'] = df['timestamp'].dt.tz_convert('UTC')

        # Ép kiểu dữ liệu số
        numeric_cols = ['open', 'high', 'low', 'close', 'volume', 'spread']
        for col in numeric_cols:
            df[col] = pd.to_numeric(df[col], errors='coerce')

        # 3. Loại bỏ hàng chứa NaN trong các cột bắt buộc
        before_count = len(df)
        df = df.dropna(subset=required_cols)
        nan_dropped = before_count - len(df)
        if nan_dropped > 0:
            logger.warning(f"Đã loại bỏ {nan_dropped} dòng chứa giá trị NaN.")

        # 4. Loại bỏ trùng lặp timestamp và sắp xếp
        before_count = len(df)
        df = df.drop_duplicates(subset=['timestamp']).sort_values('timestamp').reset_index(drop=True)
        dup_dropped = before_count - len(df)
        if dup_dropped > 0:
            logger.warning(f"Đã loại bỏ {dup_dropped} dòng trùng lặp timestamp.")

        # 5. Kiểm tra tính hợp lệ hình học của nến
        invalid_mask = (
            (df['open'] <= 0) |
            (df['high'] <= 0) |
            (df['low'] <= 0) |
            (df['close'] <= 0) |
            (df['volume'] < 0) |
            (df['high'] < df['low']) |
            (df['high'] < df[['open', 'close']].max(axis=1)) |
            (df['low'] > df[['open', 'close']].min(axis=1))
        )

        invalid_count = int(invalid_mask.sum())
        if invalid_count > 0:
            if drop_invalid:
                logger.warning(f"Phát hiện {invalid_count} nến lỗi giá hình học. Đang loại bỏ...")
                df = df[~invalid_mask].reset_index(drop=True)
            else:
                logger.error(f"Phát hiện {invalid_count} nến lỗi hình học nhưng cờ drop_invalid=False!")

        logger.info(f"Làm sạch dữ liệu hoàn tất: {len(df)} nến hợp lệ.")
        return df[['timestamp', 'open', 'high', 'low', 'close', 'volume', 'spread']]
