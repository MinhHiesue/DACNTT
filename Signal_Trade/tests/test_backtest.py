"""Unit tests cho Module 10: BacktestEngine và metrics."""
import pandas as pd
import numpy as np
import pytest

from src.mining.metrics import calculate_trade_metrics
from src.mining.backtester import BacktestEngine
from scripts.download_data import generate_synthetic_data


def test_calculate_trade_metrics_known_values():
    """Kiểm tra độ chính xác của hàm tính chỉ số giao dịch với các giá trị biết trước."""
    trades_data = {
        'net_profit': [150.0, -100.0, 150.0, 150.0], # 3 win, 1 loss
        'balance_after': [10150.0, 10050.0, 10200.0, 10350.0]
    }
    df = pd.DataFrame(trades_data)
    metrics = calculate_trade_metrics(df, initial_balance=10000.0)

    assert metrics['total_trades'] == 4
    assert metrics['win_trades'] == 3
    assert metrics['loss_trades'] == 1
    assert metrics['winrate_pct'] == 75.0
    # Gross profit = 450, Gross loss = 100 -> PF = 4.5
    assert metrics['profit_factor'] == 4.5
    assert metrics['net_profit_usd'] == 350.0
    assert metrics['final_balance'] == 10350.0
    assert metrics['win_loss_ratio'] == 1.5 # 150 / 100


def test_calculate_trade_metrics_empty():
    """Kiểm tra hàm trả về an toàn khi không có lệnh nào."""
    metrics = calculate_trade_metrics(pd.DataFrame(), initial_balance=10000.0)
    assert metrics['total_trades'] == 0
    assert metrics['winrate_pct'] == 0.0
    assert metrics['net_profit_usd'] == 0.0


def test_split_train_test_no_leakage():
    """Kiểm tra tách tập dữ liệu thời gian nghiêm ngặt không bị rò rỉ hay đè timestamp."""
    synth_df = generate_synthetic_data(num_bars=1000)
    train_df, test_df = BacktestEngine.split_train_test(synth_df, train_ratio=0.70)

    assert len(train_df) == 700
    assert len(test_df) == 300
    # Timestamp lớn nhất của Train phải nhỏ hơn Timestamp nhỏ nhất của Test
    assert train_df['timestamp'].max() < test_df['timestamp'].min()
