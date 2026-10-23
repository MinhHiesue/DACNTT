"""Script chạy Backtesting trên tập Out-of-Sample và xuất báo cáo hoàn chỉnh."""
import sys
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

# Thêm root directory vào sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from loguru import logger
from src.core.config_loader import load_config
from src.data.storage import load_from_parquet
from src.mining.pattern_miner import HistoricalPatternMiner
from src.mining.backtester import BacktestEngine
from src.engine.similarity_engine import SimilarityEngine
from src.engine.risk_manager import RiskManager


def plot_equity_curve(trades_df: pd.DataFrame, initial_balance: float, output_img: Path):
    """Vẽ biểu đồ Equity Curve chuyên nghiệp."""
    if trades_df.empty:
        return

    equity = [initial_balance] + trades_df['balance_after'].tolist()
    trade_numbers = list(range(len(equity)))

    fig, ax = plt.subplots(figsize=(10, 5), dpi=150)
    fig.patch.set_facecolor('#131722')
    ax.set_facecolor('#131722')
    ax.tick_params(colors='#888888', labelsize=8)
    ax.grid(True, color='#2A2E39', linestyle='--', linewidth=0.5, alpha=0.5)

    ax.plot(trade_numbers, equity, color='#2962FF', linewidth=2.0, label='Tài sản (Equity USD)')
    ax.axhline(y=initial_balance, color='#888888', linestyle=':', label=f'Vốn ban đầu (${initial_balance:,.0f})')

    ax.set_title("XAU/USD M5 Pattern-Matching Equity Curve (Out-of-Sample Backtest)", color='#E0E3EB', fontsize=12, fontweight='bold', pad=12)
    ax.set_xlabel("Số lượng giao dịch (Trades)", color='#888888', fontsize=9)
    ax.set_ylabel("Số dư tài khoản (USD)", color='#888888', fontsize=9)
    ax.legend(loc='upper left', facecolor='#1E222D', edgecolor='#2A2E39', labelcolor='#E0E3EB')

    output_img.parent.mkdir(parents=True, exist_ok=True)
    plt.tight_layout()
    fig.savefig(output_img, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close(fig)
    logger.info(f"Đã lưu biểu đồ Equity Curve tại: {output_img.resolve()}")


def main():
    config = load_config()
    raw_path = config.paths.raw_data
    reports_dir = root_dir / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)

    logger.info("=====================================================")
    logger.info("BẮT ĐẦU QUY TRÌNH KIỂM THỬ LỊCH SỬ (TASK-10 BACKTEST)")
    logger.info("=====================================================")

    full_df = load_from_parquet(raw_path)

    # 1. Tách chuỗi thời gian: 70% In-sample (Train) và 30% Out-of-sample (Test)
    train_df, test_df = BacktestEngine.split_train_test(full_df, train_ratio=0.70)

    # 2. Huấn luyện Memory Bank CHỈ TRÊN TẬP TRAIN (Chống hoàn toàn Lookahead bias / Data leakage)
    logger.info("Đang xây dựng Memory Bank trên tập Train (70% thời gian đầu)...")
    miner = HistoricalPatternMiner(
        buffer_usd=config.risk_manager.buffer_usd,
        min_sl_usd=config.risk_manager.min_sl_usd,
        max_sl_usd=config.risk_manager.max_sl_usd,
        min_rr_ratio=config.risk_manager.min_rr_ratio,
        volume_window_size=config.volume_filter.window_size
    )
    train_patterns_df = miner.mine_patterns(train_df)

    if train_patterns_df.empty:
        logger.error("Không tìm thấy mẫu hình thắng trong tập Train!")
        return

    # 3. Dựng SimilarityEngine nạp Memory Bank vừa đào từ tập Train
    raw_vectors = np.array(train_patterns_df['feature_vector'].tolist(), dtype=np.float32)
    directions = train_patterns_df['direction'].values.astype(np.int32)

    similarity_engine = SimilarityEngine(config=config.similarity_engine)
    similarity_engine.build_index(raw_vectors, directions)

    # 4. Chạy Backtest trên tập Test hoàn toàn xa lạ (Out-of-sample 30% thời gian sau)
    engine = BacktestEngine(initial_balance=10000.0, spread_usd=0.3, slippage_usd=0.1)
    risk_manager = RiskManager(config=config.risk_manager, account_balance=10000.0)

    trades_df, metrics = engine.run_backtest(
        test_df=test_df,
        similarity_engine=similarity_engine,
        risk_manager=risk_manager
    )

    # 5. Xuất báo cáo
    csv_report_path = reports_dir / "backtest_trades.csv"
    trades_df.to_csv(csv_report_path, index=False)
    logger.info(f"Đã lưu nhật ký giao dịch: {csv_report_path.resolve()}")

    img_report_path = reports_dir / "equity_curve.png"
    plot_equity_curve(trades_df, initial_balance=10000.0, output_img=img_report_path)

    logger.info("==================================================")
    logger.info("        OUT-OF-SAMPLE BACKTEST RESULTS")
    logger.info("==================================================")
    for k, v in metrics.items():
        logger.info(f"  • {k.replace('_', ' ').capitalize():<22}: {v}")
    logger.info("==================================================")


if __name__ == "__main__":
    main()
