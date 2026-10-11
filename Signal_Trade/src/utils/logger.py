"""Module thiết lập ghi log tập trung bằng Loguru."""
import sys
from pathlib import Path
from loguru import logger


def setup_logger(log_level: str = "INFO", logs_dir: str = "logs"):
    """
    Cấu hình Loguru ghi log ra Console và File luân phiên (Rotation).
    """
    # Xóa cấu hình handler mặc định
    logger.remove()

    log_path = Path(logs_dir)
    log_path.mkdir(parents=True, exist_ok=True)

    # 1. Console Handler với định dạng trực quan
    console_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
        "<level>{message}</level>"
    )
    logger.add(
        sys.stdout,
        level=log_level,
        format=console_format,
        colorize=True,
        backtrace=True,
        diagnose=True,
    )

    # 2. File Handler xoay vòng (10MB/file, giữ lại 14 ngày)
    file_format = (
        "{time:YYYY-MM-DD HH:mm:ss.SSS} | "
        "{level: <8} | "
        "{name}:{function}:{line} - "
        "{message}"
    )
    logger.add(
        str(log_path / "bot_{time:YYYY-MM-DD}.log"),
        rotation="10 MB",
        retention="14 days",
        level="DEBUG",
        format=file_format,
        encoding="utf-8",
        enqueue=True, # Thread-safe
        backtrace=True,
        diagnose=True,
    )

    logger.info(f"Hệ thống Logging đã sẵn sàng. Thư mục log: {log_path.resolve()}")
    return logger


# Khởi tạo mặc định
app_logger = logger
