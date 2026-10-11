"""Module 2: Trích xuất đặc trưng & Chuẩn hóa Vector (Feature Engineering)."""
import numpy as np
import pandas as pd
from loguru import logger
from ta.momentum import RSIIndicator
from ta.volatility import AverageTrueRange


class FeatureExtractor:
    """
    Trích xuất Feature Vector 49 chiều từ chuỗi nến M5:
    - 45 chiều: Normalized Price Curve (Delta Close, Delta High, Delta Low của 15 nến so với Close_{t-14}).
    - 4 chiều: Micro Indicators (VWAP Distance chuẩn hóa theo ATR14, RSI7, Body-to-Wick Ratio, Volume Z-Score 20 nến).
    """

    def __init__(
        self,
        window_size: int = 15,
        rsi_period: int = 7,
        vol_zscore_period: int = 20,
        atr_period: int = 14,
        vwap_period: int = 30,
        epsilon: float = 1e-6
    ):
        self.window_size = window_size
        self.rsi_period = rsi_period
        self.vol_zscore_period = vol_zscore_period
        self.atr_period = atr_period
        self.vwap_period = vwap_period
        self.epsilon = epsilon
        self.min_buffer_bars = max(window_size + 15, vol_zscore_period + 10, atr_period + 15, 50)
        self.total_dim = window_size * 3 + 4 # 15*3 + 4 = 49

    def extract_from_window(self, df_buffer: pd.DataFrame) -> np.ndarray:
        """
        Trích xuất vector 49 chiều từ DataFrame bộ đệm (tối thiểu 50 nến gần nhất).
        Nến cuối cùng [iloc[-1]] là nến t vừa đóng.
        15 nến cuối cùng [iloc[-15:]] là cửa sổ setup [t-14 đến t].
        """
        if len(df_buffer) < self.min_buffer_bars:
            raise ValueError(
                f"DataFrame cần tối thiểu {self.min_buffer_bars} nến để tính toán chỉ báo, nhận được {len(df_buffer)} nến."
            )

        # 1. Trích xuất cửa sổ 15 nến setup
        window_15 = df_buffer.iloc[-self.window_size:].copy()
        anchor_close = float(window_15['close'].iloc[0]) # Close_{t-14}

        # Normalized Price Curve (45 chiều)
        delta_close = (window_15['close'].values - anchor_close).astype(np.float32)
        delta_high = (window_15['high'].values - anchor_close).astype(np.float32)
        delta_low = (window_15['low'].values - anchor_close).astype(np.float32)

        # 2. Tính các chỉ báo vi mô tại nến t (Micro Indicators)
        # 2.1. ATR(14)
        atr_series = AverageTrueRange(
            high=df_buffer['high'],
            low=df_buffer['low'],
            close=df_buffer['close'],
            window=self.atr_period
        ).average_true_range()
        current_atr = float(atr_series.iloc[-1])
        if np.isnan(current_atr) or current_atr <= 0:
            current_atr = float((df_buffer['high'].iloc[-1] - df_buffer['low'].iloc[-1]) + self.epsilon)

        # 2.2. Rolling VWAP (30 nến gần nhất)
        vwap_slice = df_buffer.iloc[-self.vwap_period:]
        typical_price = (vwap_slice['high'] + vwap_slice['low'] + vwap_slice['close']) / 3.0
        sum_vol = float(vwap_slice['volume'].sum())
        if sum_vol > 0:
            vwap = float((typical_price * vwap_slice['volume']).sum() / sum_vol)
        else:
            vwap = float(typical_price.mean())

        # VWAP Distance chuẩn hóa theo ATR
        current_close = float(df_buffer['close'].iloc[-1])
        f1_vwap_dist = float((current_close - vwap) / (current_atr + self.epsilon))

        # 2.3. RSI(7) chuẩn hóa về [-1.0, 1.0]
        rsi_series = RSIIndicator(close=df_buffer['close'], window=self.rsi_period).rsi()
        raw_rsi = float(rsi_series.iloc[-1])
        if np.isnan(raw_rsi):
            raw_rsi = 50.0
        f2_rsi = float((raw_rsi - 50.0) / 50.0)

        # 2.4. Body-to-Wick Ratio tại nến t
        current_open = float(df_buffer['open'].iloc[-1])
        current_high = float(df_buffer['high'].iloc[-1])
        current_low = float(df_buffer['low'].iloc[-1])

        body_len = abs(current_close - current_open)
        candle_range = (current_high - current_low) + self.epsilon
        f3_body_ratio = float(min(1.0, max(0.0, body_len / candle_range)))

        # 2.5. Normalized Volume Z-Score (20 nến gần nhất)
        vol_slice = df_buffer['volume'].iloc[-self.vol_zscore_period:].values.astype(np.float64)
        vol_mean = float(np.mean(vol_slice))
        vol_std = float(np.std(vol_slice)) + self.epsilon
        current_vol = float(vol_slice[-1])
        f4_vol_zscore = float((current_vol - vol_mean) / vol_std)

        micro_indicators = np.array([f1_vwap_dist, f2_rsi, f3_body_ratio, f4_vol_zscore], dtype=np.float32)

        # 3. Ghép nối thành vector 49 chiều
        vector = np.concatenate([delta_close, delta_high, delta_low, micro_indicators])

        # 4. Kiểm tra toàn vẹn vector
        if len(vector) != self.total_dim:
            raise ValueError(f"Vector trích xuất có kích thước sai: {len(vector)} != {self.total_dim}")

        if np.isnan(vector).any() or np.isinf(vector).any():
            # Thay thế NaN/Inf an toàn nếu có biến dị cực đoan
            vector = np.nan_to_num(vector, nan=0.0, posinf=1.0, neginf=-1.0)

        return vector.astype(np.float32)
