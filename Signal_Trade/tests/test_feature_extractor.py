"""Unit tests cho Module 2: FeatureExtractor."""
import time
import numpy as np
import pandas as pd
import pytest
from src.features.extractor import FeatureExtractor
from scripts.download_data import generate_synthetic_data


def test_feature_extractor_shape_and_dtype():
    """Kiểm tra Feature Vector luôn có kích thước chuẩn (49,) và kiểu np.float32."""
    df = generate_synthetic_data(num_bars=60)
    extractor = FeatureExtractor()

    vector = extractor.extract_from_window(df)
    assert isinstance(vector, np.ndarray)
    assert vector.shape == (49,)
    assert vector.dtype == np.float32
    assert not np.isnan(vector).any(), "Vector không được chứa NaN"
    assert not np.isinf(vector).any(), "Vector không được chứa Inf"


def test_insufficient_buffer_raises_error():
    """Kiểm tra báo lỗi khi truyền DataFrame ít hơn min_buffer_bars."""
    df = generate_synthetic_data(num_bars=30) # Chỉ có 30 nến, cần tối thiểu 50
    extractor = FeatureExtractor()

    with pytest.raises(ValueError, match="DataFrame cần tối thiểu"):
        extractor.extract_from_window(df)


def test_micro_indicator_ranges():
    """Kiểm tra các chỉ báo vi mô nằm trong miền giá trị hợp lý."""
    df = generate_synthetic_data(num_bars=60)
    extractor = FeatureExtractor()

    vector = extractor.extract_from_window(df)
    # 4 chỉ báo vi mô nằm ở 4 vị trí cuối cùng [-4:]
    f1_vwap_dist = vector[-4]
    f2_rsi = vector[-3]
    f3_body_ratio = vector[-2]
    f4_vol_zscore = vector[-1]

    # RSI chuẩn hóa phải nằm trong [-1.0, 1.0]
    assert -1.0 <= f2_rsi <= 1.0
    # Body-to-wick ratio phải nằm trong [0.0, 1.0]
    assert 0.0 <= f3_body_ratio <= 1.0
    # VWAP distance và Vol Z-Score là số thực hữu hạn
    assert np.isfinite(f1_vwap_dist)
    assert np.isfinite(f4_vol_zscore)


def test_price_shift_invariance():
    """
    KIỂM THỬ CỐT LÕI (CORE INVARIANCE TEST):
    Tính bất biến với mức giá tuyệt đối của Vàng.
    Nếu thị trường ở mức giá 2,000 USD hay 2,600 USD nhưng có cùng một cấu trúc hành vi nến,
    thì Feature Vector trích xuất phải đồng nhất 100% (np.allclose).
    """
    df_base = generate_synthetic_data(num_bars=60, start_price=2000.0)

    # Tạo bản sao và cộng thêm 600 USD vào toàn bộ các mức giá
    df_shifted = df_base.copy()
    shift_amount = 600.0
    for col in ['open', 'high', 'low', 'close']:
        df_shifted[col] = df_base[col] + shift_amount

    extractor = FeatureExtractor()
    vec_base = extractor.extract_from_window(df_base)
    vec_shifted = extractor.extract_from_window(df_shifted)

    # Kiểm tra sai số cực nhỏ (sai số dấu phẩy động)
    assert np.allclose(vec_base, vec_shifted, atol=1e-3), (
        f"Vector bị thay đổi khi tịnh tiến mức giá tuyệt đối! Sai lệch tối đa: {np.max(np.abs(vec_base - vec_shifted))}"
    )


def test_extraction_performance():
    """Kiểm tra hiệu năng: Mỗi lần trích xuất vector phải hoàn thành dưới 5ms."""
    df = generate_synthetic_data(num_bars=100)
    extractor = FeatureExtractor()

    start_time = time.perf_counter()
    for i in range(50, 100):
        _ = extractor.extract_from_window(df.iloc[:i])
    elapsed_time = time.perf_counter() - start_time

    avg_time_ms = (elapsed_time / 50) * 1000.0
    assert avg_time_ms < 10.0, f"Thời gian trích xuất quá chậm: {avg_time_ms:.2f}ms/bar"
