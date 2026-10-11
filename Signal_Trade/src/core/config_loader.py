"""Module nạp và kiểm tra tính hợp lệ của cấu hình hệ thống."""
import os
from pathlib import Path
from typing import Optional
import yaml
from dotenv import load_dotenv
from pydantic import BaseModel, Field


class SystemConfig(BaseModel):
    symbol: str = "XAUUSD"
    timeframe: str = "M5"
    timezone: str = "UTC"
    log_level: str = "INFO"


class VolumeFilterConfig(BaseModel):
    window_size: int = Field(default=100, ge=20)
    lower_percentile: float = Field(default=20.0, ge=0.0, le=50.0)
    upper_percentile: float = Field(default=85.0, ge=50.0, le=100.0)


class FeatureExtractorConfig(BaseModel):
    window_size: int = Field(default=15, ge=5)
    rsi_period: int = Field(default=7, ge=2)
    vol_zscore_period: int = Field(default=20, ge=5)
    atr_period: int = Field(default=14, ge=2)
    epsilon: float = 1e-6


class SimilarityEngineConfig(BaseModel):
    min_similarity: float = Field(default=0.85, ge=0.5, le=1.0)
    min_neighbors: int = Field(default=10, ge=1)
    consensus_ratio: float = Field(default=0.80, ge=0.5, le=1.0)
    backend: str = "faiss"


class RiskManagerConfig(BaseModel):
    swing_window: int = Field(default=15, ge=5)
    buffer_usd: float = Field(default=0.5, ge=0.0)
    min_rr_ratio: float = Field(default=1.5, ge=1.0)
    risk_percent: float = Field(default=1.0, ge=0.1, le=10.0)
    min_sl_usd: float = Field(default=1.0, ge=0.1)
    max_sl_usd: float = Field(default=6.0, ge=1.0)


class ExecutionConfig(BaseModel):
    mode: str = "dry-run"
    auto_trade: bool = False
    magic_number: int = 108899
    slippage_points: int = 20
    poll_interval_sec: float = 1.0


class PathsConfig(BaseModel):
    raw_data: str = "data/raw/xauusd_m5.parquet"
    pattern_db: str = "data/patterns/winning_patterns.parquet"
    logs_dir: str = "logs"


class MT5Credentials(BaseModel):
    login: Optional[int] = None
    password: Optional[str] = None
    server: Optional[str] = None
    path: Optional[str] = None


class TelegramCredentials(BaseModel):
    bot_token: Optional[str] = None
    chat_id: Optional[str] = None


class AppConfig(BaseModel):
    system: SystemConfig = Field(default_factory=SystemConfig)
    volume_filter: VolumeFilterConfig = Field(default_factory=VolumeFilterConfig)
    feature_extractor: FeatureExtractorConfig = Field(default_factory=FeatureExtractorConfig)
    similarity_engine: SimilarityEngineConfig = Field(default_factory=SimilarityEngineConfig)
    risk_manager: RiskManagerConfig = Field(default_factory=RiskManagerConfig)
    execution: ExecutionConfig = Field(default_factory=ExecutionConfig)
    paths: PathsConfig = Field(default_factory=PathsConfig)
    mt5: MT5Credentials = Field(default_factory=MT5Credentials)
    telegram: TelegramCredentials = Field(default_factory=TelegramCredentials)


def load_config(config_file_path: Optional[str] = None, env_file_path: Optional[str] = None) -> AppConfig:
    """Nạp file YAML cấu hình và biến môi trường .env."""
    root_dir = Path(__file__).resolve().parent.parent.parent

    # Nạp file .env nếu có
    if env_file_path is None:
        potential_env = [
            root_dir / ".env",
            root_dir / "config" / ".env",
        ]
        for p in potential_env:
            if p.exists():
                load_dotenv(p)
                break
    else:
        load_dotenv(env_file_path)

    # Nạp file config.yaml
    if config_file_path is None:
        yaml_path = root_dir / "config" / "config.yaml"
    else:
        yaml_path = Path(config_file_path)

    raw_yaml = {}
    if yaml_path.exists():
        with open(yaml_path, "r", encoding="utf-8") as f:
            raw_yaml = yaml.safe_load(f) or {}

    # Nạp credentials từ biến môi trường
    mt5_creds = {
        "login": int(os.getenv("MT5_LOGIN")) if os.getenv("MT5_LOGIN") else None,
        "password": os.getenv("MT5_PASSWORD"),
        "server": os.getenv("MT5_SERVER"),
        "path": os.getenv("MT5_PATH"),
    }

    telegram_creds = {
        "bot_token": os.getenv("TELEGRAM_BOT_TOKEN"),
        "chat_id": os.getenv("TELEGRAM_CHAT_ID"),
    }

    raw_yaml["mt5"] = mt5_creds
    raw_yaml["telegram"] = telegram_creds

    return AppConfig(**raw_yaml)
