"""Module nạp và chuẩn hóa dữ liệu nến từ file CSV/TXT."""
from pathlib import Path
from typing import Optional, Union
import pandas as pd
from loguru import logger
from src.data.sanitizer import DataSanitizer


class CSVDataLoader:
    """Nạp nến M5 từ các định dạng file CSV/TXT khác nhau."""

    @staticmethod
    def load_csv(
        file_path: Union[str, Path],
        delimiter: Optional[str] = None,
        tz_source: str = "UTC"
    ) -> pd.DataFrame:
        """
        Nạp file CSV/TXT và tự động nhận dạng định dạng:
        - Chuẩn MT5 Export: <DATE>, <TIME>, <OPEN>, <HIGH>, <LOW>, <CLOSE>, <TICKVOL>, <VOL>, <SPREAD>
        - Chuẩn TradingView / Generic: timestamp/time/date, open, high, low, close, volume
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Không tìm thấy file: {path.resolve()}")

        # Tự động đoán delimiter nếu không truyền
        if delimiter is None:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                first_line = f.readline()
                if "\t" in first_line:
                    delimiter = "\t"
                elif ";" in first_line:
                    delimiter = ";"
                else:
                    delimiter = ","

        df = pd.read_csv(path, sep=delimiter)
        logger.info(f"Đã đọc file CSV {path.name}: {len(df)} dòng, các cột: {list(df.columns)}")

        # Chuẩn hóa tên cột về chữ thường và xóa ký tự đặc biệt
        col_map = {c: c.strip().lower().replace("<", "").replace(">", "") for c in df.columns}
        df.rename(columns=col_map, inplace=True)

        # Xử lý trường hợp cột Date và Time tách riêng (chuẩn MT5 export)
        if 'date' in df.columns and 'time' in df.columns and 'timestamp' not in df.columns:
            # Ví dụ: date='2024.01.02', time='00:00:00'
            df['timestamp'] = pd.to_datetime(
                df['date'].astype(str) + " " + df['time'].astype(str),
                format='mixed',
                errors='coerce'
            )
        elif 'datetime' in df.columns and 'timestamp' not in df.columns:
            df['timestamp'] = pd.to_datetime(df['datetime'], errors='coerce')
        elif 'time' in df.columns and 'timestamp' not in df.columns:
            # Có thể time là epoch int hoặc string
            df['timestamp'] = pd.to_datetime(df['time'], errors='coerce')

        # Map tên cột volume
        if 'volume' not in df.columns:
            if 'tickvol' in df.columns:
                df['volume'] = df['tickvol']
            elif 'vol' in df.columns:
                df['volume'] = df['vol']
            elif 'tick_volume' in df.columns:
                df['volume'] = df['tick_volume']
            else:
                df['volume'] = 1.0 # Fallback nếu thiếu volume

        # Xử lý múi giờ nguồn
        if pd.api.types.is_datetime64_any_dtype(df['timestamp']):
            if df['timestamp'].dt.tz is None:
                df['timestamp'] = df['timestamp'].dt.tz_localize(tz_source).dt.tz_convert("UTC")

        # Đảm bảo các cột cần thiết có mặt
        target_cols = ['timestamp', 'open', 'high', 'low', 'close', 'volume']
        if 'spread' in df.columns:
            target_cols.append('spread')
        else:
            df['spread'] = 0.0
            target_cols.append('spread')

        df = df[target_cols]

        # Chuyển qua bộ lọc làm sạch toàn vẹn
        return DataSanitizer.sanitize(df)
