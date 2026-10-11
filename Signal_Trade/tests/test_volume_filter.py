"""Unit tests cho Module 1: VolumeRegimeFilter."""
import pytest
import numpy as np
import pandas as pd
from pathlib import Path
from src.features.volume_filter import VolumeRegimeFilter
from src.data.storage import load_from_parquet


def test_volume_filter_initialization():
    """Kiểm tra khởi tạo tham số hợp lệ và bất hợp lệ."""
    vf = VolumeRegimeFilter(window_size=100, lower_percentile=20.0, upper_percentile=85.0)
    assert vf.window_size == 100
    assert vf.lower_p == 20.0
    assert vf.upper_p == 85.0

    with pytest.raises(ValueError):
        VolumeRegimeFilter(window_size=5) # Nhỏ hơn 10

    with pytest.raises(ValueError):
        VolumeRegimeFilter(lower_percentile=90.0, upper_percentile=80.0) # Lower > Upper


def test_evaluate_bar_conditions():
    """Kiểm tra đầy đủ các trạng thái của evaluate_bar."""
    vf = VolumeRegimeFilter(window_size=100, lower_percentile=20.0, upper_percentile=85.0)

    # 1. Thiếu dữ liệu
    short_series = np.ones(50)
    res = vf.evaluate_bar(short_series)
    assert res.pass_filter is False
    assert res.reason == "INSUFFICIENT_DATA"

    # Tạo mảng 100 phần tử từ 1 đến 100
    # P20 của [1..100] ~ 20.8, P85 ~ 85.15
    base = np.arange(1, 101, dtype=np.float64)

    # 2. Giá trị đạt chuẩn nằm giữa P20 và P85 (ví dụ: 50.0)
    base[-1] = 50.0
    res = vf.evaluate_bar(base)
    assert res.pass_filter is True
    assert res.reason == "PASS"

    # 3. Giá trị quá thấp (< P20, ví dụ: 5.0)
    base[-1] = 5.0
    res = vf.evaluate_bar(base)
    assert res.pass_filter is False
    assert res.reason == "BELOW_P20"

    # 4. Giá trị quá cao (> P85, ví dụ: 99.0)
    base[-1] = 99.0
    res = vf.evaluate_bar(base)
    assert res.pass_filter is False
    assert res.reason == "ABOVE_P85"


def test_consistency_between_stream_and_batch():
    """Kiểm tra tính nhất quán 100% giữa evaluate_bar (stream) và apply_to_dataframe (batch)."""
    np.random.seed(123)
    volumes = np.random.lognormal(mean=5.0, sigma=0.5, size=300)
    df = pd.DataFrame({'volume': volumes})

    vf = VolumeRegimeFilter(window_size=100, lower_percentile=20.0, upper_percentile=85.0)
    batch_df = vf.apply_to_dataframe(df)

    # Kiểm tra 50 nến ngẫu nhiên từ index 100 đến 299
    for idx in range(100, 300, 5):
        slice_vol = volumes[:idx + 1]
        stream_res = vf.evaluate_bar(slice_vol)
        batch_val = batch_df.loc[idx, 'volume_filter_pass']
        assert stream_res.pass_filter == bool(batch_val), f"Lệch kết quả tại index {idx}"


def test_volume_filter_on_historical_dataset():
    """Kiểm tra áp dụng trên dữ liệu 1 năm thực tế data/raw/xauusd_m5.parquet."""
    parquet_path = Path("data/raw/xauusd_m5.parquet")
    if not parquet_path.exists():
        pytest.skip("Chưa có file dữ liệu xauusd_m5.parquet")

    df = load_from_parquet(parquet_path)
    vf = VolumeRegimeFilter(window_size=100, lower_percentile=20.0, upper_percentile=85.0)
    processed_df = vf.apply_to_dataframe(df)

    assert 'volume_filter_pass' in processed_df.columns
    evaluated_bars = processed_df.iloc[100:]
    pass_ratio = evaluated_bars['volume_filter_pass'].mean() * 100.0

    # Phân vị 85% - 20% trên mẫu lớn phải xấp xỉ 65% (dung sai ±3%)
    assert 62.0 <= pass_ratio <= 68.0, f"Tỷ lệ đạt chuẩn {pass_ratio:.2f}% nằm ngoài khoảng kỳ vọng [62%, 68%]"
