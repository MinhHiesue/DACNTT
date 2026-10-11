"""Unit tests cho DataSanitizer, CSVDataLoader và Storage."""
import tempfile
from pathlib import Path
from datetime import datetime, timezone
import pandas as pd
import numpy as np
import pytest

from src.data.sanitizer import DataSanitizer
from src.data.csv_loader import CSVDataLoader
from src.data.storage import save_to_parquet, load_from_parquet
from scripts.download_data import generate_synthetic_data


def test_data_sanitizer_cleans_invalid_bars():
    """Kiểm tra DataSanitizer loại bỏ đúng các nến lỗi giá hình học và trùng lặp."""
    now = datetime(2024, 1, 1, 12, 0, tzinfo=timezone.utc)
    raw_data = {
        'timestamp': [
            now,
            now, # Trùng lặp timestamp
            now + pd.Timedelta(minutes=5),
            now + pd.Timedelta(minutes=10), # Nến lỗi High < Low
            now + pd.Timedelta(minutes=15), # Nến lỗi Open > High
            now + pd.Timedelta(minutes=20),
        ],
        'open': [2000.0, 2000.0, 2002.0, 2005.0, 2010.0, 2004.0],
        'high': [2005.0, 2005.0, 2008.0, 2001.0, 2008.0, 2009.0], # 2001 < 2005 (High < Low), 2008 < 2010 (High < Open)
        'low':  [1998.0, 1998.0, 2001.0, 2003.0, 2005.0, 2002.0],
        'close':[2002.0, 2002.0, 2004.0, 2002.0, 2006.0, 2007.0],
        'volume':[150.0, 150.0, 200.0, 180.0, 300.0, 220.0],
    }
    df = pd.DataFrame(raw_data)
    cleaned = DataSanitizer.sanitize(df)

    # Nến hợp lệ còn lại: dòng 0, dòng 2, dòng 5 (tổng cộng 3 nến)
    assert len(cleaned) == 3
    assert cleaned.iloc[0]['close'] == 2002.0
    assert cleaned.iloc[1]['close'] == 2004.0
    assert cleaned.iloc[2]['close'] == 2007.0
    assert (cleaned['high'] >= cleaned['low']).all()
    assert (cleaned['high'] >= cleaned[['open', 'close']].max(axis=1)).all()
    assert (cleaned['low'] <= cleaned[['open', 'close']].min(axis=1)).all()


def test_csv_data_loader(tmp_path):
    """Kiểm tra CSVDataLoader đọc file xuất từ MT5."""
    csv_file = tmp_path / "mt5_sample.csv"
    csv_content = (
        "<DATE>\t<TIME>\t<OPEN>\t<HIGH>\t<LOW>\t<CLOSE>\t<TICKVOL>\t<VOL>\t<SPREAD>\n"
        "2024.01.02\t00:00:00\t2060.50\t2062.00\t2059.80\t2061.20\t312\t0\t25\n"
        "2024.01.02\t00:05:00\t2061.20\t2063.50\t2060.00\t2062.80\t450\t0\t25\n"
    )
    csv_file.write_text(csv_content, encoding="utf-8")

    df = CSVDataLoader.load_csv(csv_file)
    assert len(df) == 2
    assert list(df.columns) == ['timestamp', 'open', 'high', 'low', 'close', 'volume', 'spread']
    assert df.iloc[0]['open'] == 2060.50
    assert df.iloc[1]['volume'] == 450.0


def test_parquet_storage(tmp_path):
    """Kiểm tra lưu và nạp định dạng Parquet."""
    parquet_path = tmp_path / "test_data.parquet"
    synth_df = generate_synthetic_data(num_bars=100)
    save_to_parquet(synth_df, parquet_path)

    loaded_df = load_from_parquet(parquet_path)
    assert len(loaded_df) == 100
    assert np.allclose(synth_df['close'].values, loaded_df['close'].values)
    assert synth_df['timestamp'].iloc[0] == loaded_df['timestamp'].iloc[0]
