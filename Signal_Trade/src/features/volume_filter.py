"""Module 1: Bộ lọc trạng thái khối lượng (Volume Regime Filter)."""
from typing import Union, Dict, Any
import numpy as np
import pandas as pd
from loguru import logger
from src.core.schemas import VolumeFilterResult


class VolumeRegimeFilter:
    """
    Module 1: Volume Regime Filter.
    Loại bỏ các giai đoạn thị trường thanh khoản kiệt quệ (< P20)
    hoặc biến động bão tin tức cực đoan (> P85) trên cửa sổ 100 nến M5.
    """

    def __init__(
        self,
        window_size: int = 100,
        lower_percentile: float = 20.0,
        upper_percentile: float = 85.0
    ):
        if window_size < 10:
            raise ValueError(f"window_size phải >= 10, nhận được: {window_size}")
        if not (0.0 <= lower_percentile < upper_percentile <= 100.0):
            raise ValueError(f"Ngưỡng phân vị không hợp lệ: lower={lower_percentile}, upper={upper_percentile}")

        self.window_size = window_size
        self.lower_p = lower_percentile
        self.upper_p = upper_percentile

    def evaluate_bar(self, volume_series: Union[np.ndarray, list, pd.Series]) -> VolumeFilterResult:
        """
        Đánh giá nến vừa đóng ở chế độ realtime/stream.
        volume_series: Mảng 1 chiều chứa chuỗi volume, phần tử cuối cùng [-1] là nến vừa đóng.
        """
        arr = np.asarray(volume_series, dtype=np.float64)

        if len(arr) < self.window_size:
            return VolumeFilterResult(
                pass_filter=False,
                current_vol=float(arr[-1]) if len(arr) > 0 else 0.0,
                p20=0.0,
                p85=0.0,
                reason="INSUFFICIENT_DATA"
            )

        window = arr[-self.window_size:]
        current_vol = float(window[-1])

        # Tính phân vị theo chuẩn nội suy tuyến tính (linear)
        p20 = float(np.percentile(window, self.lower_p, method='linear'))
        p85 = float(np.percentile(window, self.upper_p, method='linear'))

        pass_filter = bool(p20 <= current_vol <= p85)

        if pass_filter:
            reason = "PASS"
        elif current_vol < p20:
            reason = "BELOW_P20"
        else:
            reason = "ABOVE_P85"

        return VolumeFilterResult(
            pass_filter=pass_filter,
            current_vol=current_vol,
            p20=p20,
            p85=p85,
            reason=reason
        )

    def apply_to_dataframe(self, df: pd.DataFrame, volume_col: str = "volume") -> pd.DataFrame:
        """
        Áp dụng bộ lọc cho toàn bộ DataFrame lịch sử (chế độ batch phục vụ Mining/Backtest).
        """
        if volume_col not in df.columns:
            raise KeyError(f"Không tìm thấy cột '{volume_col}' trong DataFrame.")

        df = df.copy()

        # Rolling quantile với phương pháp linear đồng nhất với numpy
        df['vol_p20'] = df[volume_col].rolling(
            window=self.window_size, min_periods=self.window_size
        ).quantile(self.lower_p / 100.0, interpolation='linear')

        df['vol_p85'] = df[volume_col].rolling(
            window=self.window_size, min_periods=self.window_size
        ).quantile(self.upper_p / 100.0, interpolation='linear')

        # Điền cờ hợp lệ
        valid_condition = (df[volume_col] >= df['vol_p20']) & (df[volume_col] <= df['vol_p85'])
        df['volume_filter_pass'] = valid_condition.fillna(False)

        pass_count = int(df['volume_filter_pass'].sum())
        total_eval = len(df) - self.window_size + 1
        if total_eval > 0:
            pass_ratio = pass_count / total_eval * 100.0
            logger.info(
                f"Volume Filter hoàn tất: {pass_count}/{total_eval} nến đạt chuẩn ({pass_ratio:.2f}%)."
            )

        return df
