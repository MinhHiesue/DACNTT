"""Module 3: Khai thác mẫu hình lịch sử & Gán nhãn Triple Barrier (Offline Pattern Mining)."""
from pathlib import Path
from typing import Optional, List, Dict, Any, Union
import numpy as np
import pandas as pd
from loguru import logger

from src.features.extractor import FeatureExtractor
from src.features.volume_filter import VolumeRegimeFilter
from src.data.storage import save_to_parquet, load_from_parquet


class HistoricalPatternMiner:
    """
    Khai thác và gán nhãn các mẫu hình chiến thắng trong quá khứ theo Triple Barrier Method.
    Lưu trữ thành Memory Bank phục vụ cho Similarity Engine.
    """

    def __init__(
        self,
        horizon_bars: int = 12,
        buffer_usd: float = 0.5,
        min_rr_ratio: float = 1.5,
        spread_usd: float = 0.3,
        min_sl_usd: float = 1.0,
        max_sl_usd: float = 6.0,
        cooldown_bars: int = 3,
        volume_window_size: int = 100
    ):
        self.horizon_bars = horizon_bars
        self.buffer_usd = buffer_usd
        self.min_rr_ratio = min_rr_ratio
        self.spread_usd = spread_usd
        self.min_sl_usd = min_sl_usd
        self.max_sl_usd = max_sl_usd
        self.cooldown_bars = cooldown_bars

        self.feature_extractor = FeatureExtractor()
        self.volume_filter = VolumeRegimeFilter(window_size=volume_window_size)

    def mine_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Quét qua toàn bộ chuỗi nến lịch sử và khai thác các mẫu hình thắng.
        """
        if len(df) < self.feature_extractor.min_buffer_bars + self.horizon_bars:
            raise ValueError(f"Dữ liệu quá ngắn để khai thác mẫu hình ({len(df)} nến).")

        logger.info(f"Bắt đầu áp dụng Volume Filter trên {len(df)} nến...")
        df_filtered = self.volume_filter.apply_to_dataframe(df)

        highs = df_filtered['high'].values
        lows = df_filtered['low'].values
        closes = df_filtered['close'].values
        timestamps = df_filtered['timestamp'].values
        vol_pass = df_filtered['volume_filter_pass'].values

        n_bars = len(df_filtered)
        min_start_idx = self.feature_extractor.min_buffer_bars # Cần đủ buffer phía trước
        max_end_idx = n_bars - self.horizon_bars # Cần đủ 12 nến phía sau

        winning_records: List[Dict[str, Any]] = []
        last_long_idx = -999
        last_short_idx = -999

        logger.info(f"Đang quét mẫu hình từ nến {min_start_idx} đến {max_end_idx}...")

        for t in range(min_start_idx, max_end_idx):
            # 1. Bỏ qua nếu nến t không đạt Volume Filter
            if not vol_pass[t]:
                continue

            entry_price = float(closes[t])
            # Cửa sổ 15 nến setup [t-14 : t]
            setup_lows = lows[t - 14 : t + 1]
            setup_highs = highs[t - 14 : t + 1]

            swing_low = float(np.min(setup_lows))
            swing_high = float(np.max(setup_highs))

            # 12 nến tương lai [t+1 : t+12]
            fwd_highs = highs[t + 1 : t + 1 + self.horizon_bars]
            fwd_lows = lows[t + 1 : t + 1 + self.horizon_bars]

            # ==========================================
            # KIỂM TRA MẪU HÌNH LONG
            # ==========================================
            if (t - last_long_idx) >= self.cooldown_bars:
                sl_long = swing_low - self.buffer_usd
                delta_sl_long = entry_price - sl_long

                if self.min_sl_usd <= delta_sl_long <= self.max_sl_usd:
                    tp_distance_long = delta_sl_long * self.min_rr_ratio
                    tp_long = entry_price + tp_distance_long
                    tp_long_with_spread = tp_long + self.spread_usd

                    # Kiểm tra Triple Barrier cho LONG
                    long_win = False
                    for step in range(self.horizon_bars):
                        bar_low = fwd_lows[step]
                        bar_high = fwd_highs[step]

                        hit_sl = bar_low <= sl_long
                        hit_tp = bar_high >= tp_long_with_spread

                        if hit_sl and hit_tp:
                            # Nguyên tắc bảo thủ: Coi như cắn SL trước
                            break
                        elif hit_sl:
                            break
                        elif hit_tp:
                            long_win = True
                            break

                    if long_win:
                        max_move_long = float(np.max(fwd_highs) - entry_price)
                        # Trích xuất Feature Vector của 15 nến setup
                        window_df = df_filtered.iloc[t - 49 : t + 1]
                        vec = self.feature_extractor.extract_from_window(window_df)

                        winning_records.append({
                            "timestamp": timestamps[t],
                            "direction": 1, # LONG
                            "entry_price": entry_price,
                            "sl_price": sl_long,
                            "tp_price": tp_long,
                            "rr_ratio": float(self.min_rr_ratio),
                            "max_favorable_move": max_move_long,
                            "feature_vector": vec.tolist()
                        })
                        last_long_idx = t

            # ==========================================
            # KIỂM TRA MẪU HÌNH SHORT
            # ==========================================
            if (t - last_short_idx) >= self.cooldown_bars:
                sl_short = swing_high + self.buffer_usd + self.spread_usd
                delta_sl_short = sl_short - entry_price

                if self.min_sl_usd <= delta_sl_short <= self.max_sl_usd:
                    tp_distance_short = delta_sl_short * self.min_rr_ratio
                    tp_short = entry_price - tp_distance_short

                    # Kiểm tra Triple Barrier cho SHORT
                    short_win = False
                    for step in range(self.horizon_bars):
                        bar_low = fwd_lows[step]
                        bar_high = fwd_highs[step]

                        hit_sl = bar_high >= sl_short
                        hit_tp = bar_low <= tp_short

                        if hit_sl and hit_tp:
                            # Nguyên tắc bảo thủ: Coi như cắn SL trước
                            break
                        elif hit_sl:
                            break
                        elif hit_tp:
                            short_win = True
                            break

                    if short_win:
                        max_move_short = float(entry_price - np.min(fwd_lows))
                        window_df = df_filtered.iloc[t - 49 : t + 1]
                        vec = self.feature_extractor.extract_from_window(window_df)

                        winning_records.append({
                            "timestamp": timestamps[t],
                            "direction": -1, # SHORT
                            "entry_price": entry_price,
                            "sl_price": sl_short,
                            "tp_price": tp_short,
                            "rr_ratio": float(self.min_rr_ratio),
                            "max_favorable_move": max_move_short,
                            "feature_vector": vec.tolist()
                        })
                        last_short_idx = t

        result_df = pd.DataFrame(winning_records)
        long_count = int((result_df['direction'] == 1).sum()) if not result_df.empty else 0
        short_count = int((result_df['direction'] == -1).sum()) if not result_df.empty else 0

        logger.success(
            f"Khai thác hoàn tất: Thu thập được {len(result_df)} mẫu hình thắng "
            f"(LONG: {long_count}, SHORT: {short_count})."
        )
        return result_df


def run_mining_pipeline(
    raw_data_path: Union[str, Path] = "data/raw/btcusdt_m5.parquet",
    output_pattern_path: Union[str, Path] = "data/patterns/winning_patterns.parquet",
    miner: Optional[HistoricalPatternMiner] = None
) -> pd.DataFrame:
    """Nạp dữ liệu thô, thực hiện khai thác mẫu hình và lưu vào parquet."""
    raw_path = Path(raw_data_path)
    if not raw_path.exists():
        raise FileNotFoundError(f"Không tìm thấy file nến thô tại: {raw_path.resolve()}")

    df = load_from_parquet(raw_path)
    if miner is None:
        miner = HistoricalPatternMiner()
    patterns_df = miner.mine_patterns(df)

    if not patterns_df.empty:
        save_to_parquet(patterns_df, output_pattern_path)
    else:
        logger.warning("Không tìm thấy mẫu hình thắng nào trong tập dữ liệu.")

    return patterns_df
