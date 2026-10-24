"""Script huấn luyện mô hình XGBoost cho chế độ Hybrid Ensemble."""
import sys
import json
from pathlib import Path

# Thêm root directory vào sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

import numpy as np
import pandas as pd
from loguru import logger
import xgboost as xgb
from sklearn.metrics import classification_report, accuracy_score

from src.core.config_loader import load_config
from src.data.storage import load_from_parquet
from src.features.extractor import FeatureExtractor
from src.features.volume_filter import VolumeRegimeFilter
from src.engine.xgboost_engine import FEATURE_NAMES, CLASS_MAP


def generate_training_data(
    df: pd.DataFrame,
    horizon_bars: int = 12,
    buffer_usd: float = 2.0,
    min_rr_ratio: float = 1.5,
    min_sl_usd: float = 3.0,
    max_sl_usd: float = 80.0
):
    """
    Sinh tập dữ liệu huấn luyện (X, y) từ chuỗi nến lịch sử theo Triple Barrier Method.
    y = 0: Neutral / Loss / Choppy
    y = 1: Winning Long Setup
    y = 2: Winning Short Setup
    """
    extractor = FeatureExtractor()
    vol_filter = VolumeRegimeFilter()
    df_filtered = vol_filter.apply_to_dataframe(df)

    closes = df_filtered['close'].values
    highs = df_filtered['high'].values
    lows = df_filtered['low'].values
    vol_pass = df_filtered['volume_filter_pass'].values

    n_bars = len(df_filtered)
    min_start_idx = extractor.min_buffer_bars
    max_end_idx = n_bars - horizon_bars

    X_list = []
    y_list = []
    timestamps = []

    logger.info(f"Đang trích xuất đặc trưng và gán nhãn cho {max_end_idx - min_start_idx} nến...")

    for i in range(min_start_idx, max_end_idx):
        if not vol_pass[i]:
            continue

        # Cửa sổ nến setup
        window_df = df_filtered.iloc[i - extractor.min_buffer_bars + 1 : i + 1]
        try:
            vec = extractor.extract_from_window(window_df)
        except Exception:
            continue

        entry_price = closes[i]
        setup_highs = highs[i - 14 : i + 1]
        setup_lows = lows[i - 14 : i + 1]

        # Tính SL/TP cho Long
        swing_low = np.min(setup_lows)
        sl_long = swing_low - buffer_usd
        delta_sl_long = entry_price - sl_long

        # Tính SL/TP cho Short
        swing_high = np.max(setup_highs)
        sl_short = swing_high + buffer_usd
        delta_sl_short = sl_short - entry_price

        # Quét tương lai 12 nến
        future_highs = highs[i + 1 : i + 1 + horizon_bars]
        future_lows = lows[i + 1 : i + 1 + horizon_bars]

        label = 0 # Mặc định Neutral

        # Đánh giá điều kiện LONG
        if min_sl_usd <= delta_sl_long <= max_sl_usd:
            tp_long = entry_price + (delta_sl_long * min_rr_ratio)
            # Kiểm tra xem chạm TP trước hay chạm SL trước
            hit_tp_idx = np.where(future_highs >= tp_long)[0]
            hit_sl_idx = np.where(future_lows <= sl_long)[0]

            first_tp = hit_tp_idx[0] if len(hit_tp_idx) > 0 else 999
            first_sl = hit_sl_idx[0] if len(hit_sl_idx) > 0 else 999

            if first_tp < first_sl and first_tp < horizon_bars:
                label = 1

        # Đánh giá điều kiện SHORT (nếu chưa phải Long)
        if label == 0 and (min_sl_usd <= delta_sl_short <= max_sl_usd):
            tp_short = entry_price - (delta_sl_short * min_rr_ratio)
            hit_tp_idx = np.where(future_lows <= tp_short)[0]
            hit_sl_idx = np.where(future_highs >= sl_short)[0]

            first_tp = hit_tp_idx[0] if len(hit_tp_idx) > 0 else 999
            first_sl = hit_sl_idx[0] if len(hit_sl_idx) > 0 else 999

            if first_tp < first_sl and first_tp < horizon_bars:
                label = 2

        X_list.append(vec)
        y_list.append(label)
        timestamps.append(df_filtered['timestamp'].iloc[i])

    X = np.array(X_list, dtype=np.float32)
    y = np.array(y_list, dtype=np.int32)
    return X, y, timestamps


def main():
    config = load_config()
    raw_path = Path(config.paths.raw_data)
    if not raw_path.exists():
        logger.error(f"Không tìm thấy file dữ liệu: {raw_path}")
        return

    logger.info(f"Nạp dữ liệu từ: {raw_path}")
    df = load_from_parquet(raw_path)
    logger.info(f"Đã nạp {len(df)} nến M5.")

    # 1. Sinh hoặc nạp tập dữ liệu từ cache
    cache_path = Path("data/processed/xgboost_dataset.npz")
    if cache_path.exists():
        logger.info(f"Nạp tập dữ liệu từ cache: {cache_path}")
        loaded = np.load(str(cache_path))
        X, y = loaded['X'], loaded['y']
    else:
        X, y, timestamps = generate_training_data(
            df,
            buffer_usd=config.risk_manager.buffer_usd,
            min_sl_usd=config.risk_manager.min_sl_usd,
            max_sl_usd=config.risk_manager.max_sl_usd,
            min_rr_ratio=config.risk_manager.min_rr_ratio
        )
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        np.savez_compressed(str(cache_path), X=X, y=y)
        logger.info(f"Đã lưu cache tập dữ liệu ra: {cache_path}")

    logger.info(f"Tổng số mẫu trích xuất: {len(X)}")
    counts = pd.Series(y).value_counts().to_dict()
    logger.info(f"Phân bổ nhãn: 0 (Neutral/Choppy): {counts.get(0, 0)}, 1 (Long Win): {counts.get(1, 0)}, 2 (Short Win): {counts.get(2, 0)}")

    # 2. Chia tập Train / Test theo thời gian (80% Train, 20% Out-of-Sample Test)
    split_idx = int(len(X) * 0.80)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]

    logger.info(f"Tập Train: {len(X_train)} mẫu | Tập Test (Out-of-Sample): {len(X_test)} mẫu")

    # 3. Huấn luyện XGBoost Classifier
    model = xgb.XGBClassifier(
        objective='multi:softprob',
        num_class=3,
        n_estimators=150,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        eval_metric='mlogloss'
    )

    from sklearn.utils.class_weight import compute_sample_weight
    sample_weights = compute_sample_weight('balanced', y_train)

    logger.info("Bắt đầu huấn luyện XGBoost với trọng số mẫu cân bằng (Balanced Sample Weights)...")
    model.fit(
        X_train, y_train,
        sample_weight=sample_weights,
        eval_set=[(X_train, y_train), (X_test, y_test)],
        verbose=False
    )

    # 4. Đánh giá chất lượng
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    logger.success(f"Độ chính xác Out-of-Sample: {acc*100:.2f}%")

    report = classification_report(y_test, y_pred, target_names=["NEUTRAL", "LONG", "SHORT"], output_dict=True)
    logger.info(f"Precision Long : {report['LONG']['precision']*100:.1f}% | Recall Long : {report['LONG']['recall']*100:.1f}%")
    logger.info(f"Precision Short: {report['SHORT']['precision']*100:.1f}% | Recall Short: {report['SHORT']['recall']*100:.1f}%")

    # 5. Lưu mô hình và báo cáo
    model_dir = Path("models")
    model_dir.mkdir(parents=True, exist_ok=True)
    model_path = model_dir / "xgboost_hybrid.json"
    model.save_model(str(model_path))
    logger.success(f"Đã lưu mô hình XGBoost tại: {model_path.resolve()}")

    # Trích xuất Feature Importances
    importances = model.feature_importances_
    feat_imp = {name: round(float(val), 4) for name, val in zip(FEATURE_NAMES, importances)}
    sorted_feat_imp = dict(sorted(feat_imp.items(), key=lambda x: x[1], reverse=True))

    reports_dir = Path("reports")
    reports_dir.mkdir(parents=True, exist_ok=True)
    metrics_path = reports_dir / "xgboost_metrics.json"

    metrics_payload = {
        "accuracy": round(acc, 4),
        "total_samples": len(X),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "classification_report": report,
        "feature_importances": sorted_feat_imp
    }

    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2, ensure_ascii=False)
    logger.success(f"Đã lưu báo cáo đánh giá tại: {metrics_path.resolve()}")


if __name__ == "__main__":
    main()
