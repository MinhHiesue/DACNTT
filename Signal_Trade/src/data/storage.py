"""Lưu trữ và đọc dữ liệu nến định dạng Parquet tối ưu."""
from pathlib import Path
from typing import Union
import pandas as pd
from loguru import logger


def save_to_parquet(df: pd.DataFrame, file_path: Union[str, Path], compression: str = "snappy") -> Path:
    """Lưu DataFrame nến ra file Parquet nén."""
    path = Path(file_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(path, engine="pyarrow", compression=compression, index=False)
    file_size_mb = path.stat().st_size / (1024 * 1024)
    logger.info(f"Đã lưu {len(df)} dòng vào {path.resolve()} ({file_size_mb:.2f} MB)")
    return path


def load_from_parquet(file_path: Union[str, Path]) -> pd.DataFrame:
    """Nạp DataFrame từ file Parquet."""
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Không tìm thấy file: {path.resolve()}")
    df = pd.read_parquet(path, engine="pyarrow")
    logger.info(f"Đã nạp {len(df)} dòng từ {path.name}")
    return df
