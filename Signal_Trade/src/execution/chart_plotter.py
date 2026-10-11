"""Module tạo ảnh biểu đồ nến mini (Chart Snapshot) kèm đường dóng Entry/SL/TP."""
import io
from typing import Optional
import matplotlib
matplotlib.use('Agg') # Chạy non-GUI backend
import matplotlib.pyplot as plt
import pandas as pd
from loguru import logger
from src.core.schemas import TradeSignal


def generate_signal_chart_image(
    signal: TradeSignal,
    setup_bars: pd.DataFrame
) -> Optional[io.BytesIO]:
    """
    Vẽ biểu đồ nến Nhật 15 nến setup kèm các mốc kỹ thuật Entry, SL, TP.
    Trả về buffer io.BytesIO chứa ảnh PNG (trong RAM, không lưu rác ra đĩa).
    """
    if setup_bars.empty or len(setup_bars) < 5:
        return None

    fig, ax = plt.subplots(figsize=(8, 4.5), dpi=120)

    try:
        # Cấu hình giao diện Dark Mode cao cấp
        fig.patch.set_facecolor('#131722')
        ax.set_facecolor('#131722')
        ax.tick_params(colors='#888888', labelsize=8)
        ax.spines['bottom'].set_color('#2A2E39')
        ax.spines['top'].set_color('#2A2E39')
        ax.spines['left'].set_color('#2A2E39')
        ax.spines['right'].set_color('#2A2E39')
        ax.grid(True, color='#2A2E39', linestyle='--', linewidth=0.5, alpha=0.5)

        n = len(setup_bars)
        x_indices = list(range(n))

        # Vẽ từng cây nến
        for i in range(n):
            row = setup_bars.iloc[i]
            open_p = float(row['open'])
            high_p = float(row['high'])
            low_p = float(row['low'])
            close_p = float(row['close'])

            is_bullish = close_p >= open_p
            candle_color = '#089981' if is_bullish else '#F23645' # Xanh lá TradingView / Đỏ TradingView

            # Bóng nến (Wick)
            ax.plot([i, i], [low_p, high_p], color=candle_color, linewidth=1.0)

            # Thân nến (Body)
            body_bottom = min(open_p, close_p)
            body_height = max(abs(close_p - open_p), 0.05) # Đảm bảo nến doji vẫn nhìn thấy
            rect = plt.Rectangle(
                (i - 0.3, body_bottom),
                0.6,
                body_height,
                facecolor=candle_color,
                edgecolor=candle_color,
                alpha=0.9
            )
            ax.add_patch(rect)

        # Vẽ các đường kỹ thuật dóng ngang
        entry = signal.entry_price
        sl = signal.stop_loss
        tp = signal.take_profit

        # Đường Entry (Xanh dương)
        ax.axhline(y=entry, color='#2962FF', linestyle='--', linewidth=1.2, label=f'Entry: {entry:.2f}')

        # Đường Stop Loss (Đỏ)
        ax.axhline(y=sl, color='#F23645', linestyle='-', linewidth=1.2, label=f'SL: {sl:.2f} ({signal.delta_sl:.2f})')

        # Đường Take Profit (Xanh lá)
        ax.axhline(y=tp, color='#089981', linestyle='-', linewidth=1.2, label=f'TP: {tp:.2f} (R:R {signal.rr_ratio:.2f})')

        direction_text = "[LONG / BUY]" if signal.direction == "LONG" else "[SHORT / SELL]"
        ax.set_title(
            f"{signal.symbol} M5 | {direction_text} | Confidence: {signal.confidence*100:.1f}%",
            color='#E0E3EB',
            fontsize=10,
            fontweight='bold',
            pad=10
        )
        legend = ax.legend(loc='upper left', facecolor='#1E222D', edgecolor='#2A2E39', fontsize=8)
        for text in legend.get_texts():
            text.set_color('#E0E3EB')

        ax.set_xlim(-0.8, n + 0.5)

        # Xuất ra bộ nhớ BytesIO
        buf = io.BytesIO()
        plt.tight_layout()
        fig.savefig(buf, format='png', bbox_inches='tight', facecolor=fig.get_facecolor())
        buf.seek(0)
        return buf

    except Exception as e:
        logger.error(f"Lỗi khi vẽ biểu đồ nến mini: {e}")
        return None

    finally:
        # Bắt buộc đóng figure để ngăn chặn rò rỉ bộ nhớ RAM
        plt.close(fig)
        plt.close('all')
