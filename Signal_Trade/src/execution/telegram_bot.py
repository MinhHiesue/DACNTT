"""Module 5 (Execution): Gửi cảnh báo tín hiệu qua Telegram Bot."""
import time
from typing import Optional
import requests
import pandas as pd
from loguru import logger

from src.core.schemas import TradeSignal
from src.core.config_loader import TelegramCredentials
from src.execution.chart_plotter import generate_signal_chart_image


class TelegramNotifier:
    """
    Quản lý việc gửi tin nhắn và hình ảnh biểu đồ snapshot qua Telegram Bot API.
    """

    def __init__(self, credentials: Optional[TelegramCredentials] = None):
        self.bot_token = credentials.bot_token if credentials else None
        self.chat_id = credentials.chat_id if credentials else None
        self.base_url = f"https://api.telegram.org/bot{self.bot_token}" if self.bot_token else None

    @staticmethod
    def format_signal_message(signal: TradeSignal) -> str:
        """Định dạng bản tin cảnh báo đẹp mắt bằng HTML."""
        dir_emoji = "🟢 BUY / LONG" if signal.direction == "LONG" else "🔴 SELL / SHORT"
        time_str = signal.timestamp.strftime("%Y-%m-%d %H:%M:%S")

        msg = (
            f"🔔 <b>[XAU/USD M5 PATTERN ALERT]</b> 🔔\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"🎯 <b>Hướng lệnh:</b> {dir_emoji}\n"
            f"⏱ <b>Thời gian đóng nến:</b> <code>{time_str} UTC</code>\n\n"
            f"📊 <b>THÔNG SỐ VÀO LỆNH:</b>\n"
            f"• <b>Giá Entry:</b> <code>{signal.entry_price:.2f}</code>\n"
            f"• <b>Stop Loss (SL):</b> <code>{signal.stop_loss:.2f}</code> (Δ {signal.delta_sl:.2f} USD)\n"
            f"• <b>Take Profit (TP):</b> <code>{signal.take_profit:.2f}</code> (Δ {signal.delta_tp:.2f} USD)\n"
            f"• <b>Tỷ lệ R:R:</b> <b>{signal.rr_ratio:.2f}</b> (Chuẩn >= 1.5)\n"
            f"• <b>Khối lượng đề xuất:</b> <code>{signal.suggested_lot:.2f} Lot</code> (1.0% Vốn)\n\n"
            f"🧠 <b>DỮ LIỆU KÝ ỨC MẪU HÌNH:</b>\n"
            f"• <b>Độ đồng thuận:</b> <b>{signal.confidence * 100:.1f}%</b>\n"
            f"• <b>Số mẫu tương đồng:</b> {signal.matched_count} mẫu lịch sử\n"
            f"• <b>Hệ thống xác thực:</b> ✅ <b>{signal.status}</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"⚡ <i>Tín hiệu tự động từ Pattern-Matching AI Bot</i>"
        )
        return msg

    def send_message(self, text: str) -> bool:
        """Gửi tin nhắn văn bản thông thường qua Telegram."""
        if not self.bot_token or not self.chat_id:
            logger.warning("Telegram Bot Token hoặc Chat ID chưa được cấu hình. Bỏ qua gửi tin nhắn.")
            return False

        url = f"{self.base_url}/sendMessage"
        payload = {
            "chat_id": self.chat_id,
            "text": text,
            "parse_mode": "HTML",
            "disable_web_page_preview": True
        }

        try:
            resp = requests.post(url, json=payload, timeout=10)
            if resp.status_code == 200:
                logger.info("Đã gửi tin nhắn Telegram thành công.")
                return True
            else:
                logger.error(f"Gửi tin nhắn Telegram thất bại: {resp.status_code} - {resp.text}")
                return False
        except Exception as e:
            logger.error(f"Lỗi kết nối khi gửi Telegram: {e}")
            return False

    def send_signal_alert(self, signal: TradeSignal, setup_bars: Optional[pd.DataFrame] = None) -> bool:
        """
        Gửi cảnh báo tín hiệu giao dịch hoàn chỉnh kèm ảnh biểu đồ snapshot (nếu có).
        """
        caption = self.format_signal_message(signal)

        if not self.bot_token or not self.chat_id:
            logger.info(f"\n--- [MÔ PHỎNG CẢNH BÁO TELEGRAM] ---\n{caption}\n-----------------------------------")
            return False

        # Nếu có setup_bars, tạo ảnh và gửi sendPhoto
        if setup_bars is not None and not setup_bars.empty:
            chart_buf = generate_signal_chart_image(signal, setup_bars)
            if chart_buf is not None:
                url = f"{self.base_url}/sendPhoto"
                files = {"photo": ("chart.png", chart_buf, "image/png")}
                data = {
                    "chat_id": self.chat_id,
                    "caption": caption,
                    "parse_mode": "HTML"
                }
                try:
                    resp = requests.post(url, data=data, files=files, timeout=15)
                    if resp.status_code == 200:
                        logger.success("Đã gửi cảnh báo kèm biểu đồ snapshot qua Telegram thành công!")
                        return True
                    else:
                        logger.warning(f"sendPhoto thất bại ({resp.status_code}), chuyển sang gửi sendMessage fallback...")
                except Exception as e:
                    logger.error(f"Lỗi khi gửi ảnh qua Telegram: {e}")

        # Fallback gửi tin nhắn chữ
        return self.send_message(caption)
