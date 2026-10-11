"""Script chạy quy trình khai thác mẫu hình lịch sử offline (Pattern Mining Pipeline)."""
import sys
from pathlib import Path

# Thêm root directory vào sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from loguru import logger
from src.core.config_loader import load_config
from src.mining.pattern_miner import run_mining_pipeline


def main():
    config = load_config()
    raw_path = config.paths.raw_data
    pattern_path = config.paths.pattern_db

    logger.info("=====================================================")
    logger.info("BẮT ĐẦU QUY TRÌNH KHAI THÁC MẪU HÌNH LỊCH SỬ (MODULE 3)")
    logger.info(f"Dữ liệu nguồn: {raw_path}")
    logger.info(f"Đích lưu trữ:  {pattern_path}")
    logger.info("=====================================================")

    patterns_df = run_mining_pipeline(raw_data_path=raw_path, output_pattern_path=pattern_path)

    if not patterns_df.empty:
        long_count = int((patterns_df['direction'] == 1).sum())
        short_count = int((patterns_df['direction'] == -1).sum())
        logger.success("=====================================================")
        logger.success(f"HOÀN THÀNH XUẤT SẮC! Đã lưu {len(patterns_df)} mẫu hình thắng.")
        logger.success(f"• Số lượng mẫu LONG : {long_count} ({long_count/len(patterns_df)*100:.1f}%)")
        logger.success(f"• Số lượng mẫu SHORT: {short_count} ({short_count/len(patterns_df)*100:.1f}%)")
        logger.success(f"• Dung lượng file   : {Path(pattern_path).stat().st_size / (1024*1024):.2f} MB")
        logger.success("=====================================================")
    else:
        logger.warning("Không có mẫu hình nào được trích xuất.")


if __name__ == "__main__":
    main()
