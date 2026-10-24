"""Module 5 (Execution / Alerting): Gửi cảnh báo tín hiệu qua Telegram Bot cho nhiều người dùng."""
import time
from typing import Optional, List
import requests
import pandas as pd
from loguru import logger

from src.core.schemas import TradeSignal
from src.core.config_loader import TelegramCredentials
from src.execution.chart_plotter import generate_signal_chart_image


class TelegramNotifier:
    """
    Quản lý việc gửi tin nhắn và hình ảnh biểu đồ snapshot qua Telegram Bot API.
    Hỗ trợ broadcast hàng loạt cho danh sách người dùng.
    """

    def __init__(self, credentials: Optional[TelegramCredentials] = None):
        self.bot_token = credentials.bot_token if credentials else None
        self.base_url = f"https://api.telegram.org/bot{self.bot_token}" if self.bot_token else None

    @staticmethod
    def format_signal_message(signal: TradeSignal) -> str:
        """Định dạng bản tin cảnh báo đẹp mắt bằng HTML."""
        dir_emoji = "🟢 BUY / LONG" if signal.direction == "LONG" else "🔴 SELL / SHORT"
        time_str = signal.timestamp.strftime("%Y-%m-%d %H:%M:%S")

        msg = (
            f"🔔 <b>[{signal.symbol} M5 PATTERN SIGNAL]</b> 🔔\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"🎯 <b>Khuyến nghị:</b> {dir_emoji}\n"
            f"⏱ <b>Thời gian đóng nến:</b> <code>{time_str} UTC</code>\n\n"
            f"📊 <b>THÔNG SỐ KỸ THUẬT:</b>\n"
            f"• <b>Giá Entry:</b> <code>{signal.entry_price:,.2f}</code>\n"
            f"• <b>Stop Loss (SL):</b> <code>{signal.stop_loss:,.2f}</code> (Δ {signal.delta_sl:,.2f} USD)\n"
            f"• <b>Take Profit (TP):</b> <code>{signal.take_profit:,.2f}</code> (Δ {signal.delta_tp:,.2f} USD)\n"
            f"• <b>Tỷ lệ R:R:</b> <b>{signal.rr_ratio:.2f}</b> (Tối thiểu >= 1.5)\n"
            f"• <b>Quản trị rủi ro:</b> <code>1.0% Vốn</code> / lệnh\n\n"
            f"🧠 <b>DỮ LIỆU KÝ ỨC MẪU HÌNH (BINANCE):</b>\n"
            f"• <b>Độ đồng thuận:</b> <b>{signal.confidence * 100:.1f}%</b>\n"
            f"• <b>Số mẫu tương đồng:</b> {signal.matched_count} mẫu lịch sử\n"
            f"• <b>Hệ thống xác thực:</b> ✅ <b>{signal.status}</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━━━\n"
            f"⚡ <i>Hệ thống phát tín hiệu tự động Binance Pattern-Matching AI</i>"
        )
        return msg

    def send_message_to_user(self, text: str, chat_id: str) -> bool:
        """Gửi tin nhắn văn bản thông thường qua Telegram cho một user cụ thể."""
        url = f"{self.base_url}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML",
            "disable_web_page_preview": True
        }

        try:
            resp = requests.post(url, json=payload, timeout=10)
            if resp.status_code == 200:
                return True
            else:
                logger.error(f"Gửi tin nhắn thất bại tới {chat_id}: {resp.status_code} - {resp.text}")
                return False
        except Exception as e:
            logger.error(f"Lỗi kết nối khi gửi Telegram tới {chat_id}: {e}")
            return False

    def send_signal_alert(self, signal: TradeSignal, chat_ids: List[str], setup_bars: Optional[pd.DataFrame] = None) -> bool:
        """
        Gửi cảnh báo tín hiệu giao dịch kèm ảnh biểu đồ snapshot cho danh sách người dùng.
        """
        if not self.bot_token or not chat_ids:
            logger.warning("Telegram Bot Token chưa cấu hình hoặc danh sách chat_ids rỗng.")
            return False

        caption = self.format_signal_message(signal)
        
        # Tạo buffer ảnh 1 lần duy nhất để tiết kiệm tài nguyên hệ thống
        chart_buf = None
        if setup_bars is not None and not setup_bars.empty:
            chart_buf = generate_signal_chart_image(signal, setup_bars)

        success_count = 0
        url = f"{self.base_url}/sendPhoto"

        for chat_id in chat_ids:
            sent_with_photo = False
            
            # Ưu tiên gửi kèm ảnh nếu có
            if chart_buf is not None:
                chart_buf.seek(0)  # CỰC KỲ QUAN TRỌNG: Đặt lại con trỏ file về đầu trước mỗi lần gửi
                files = {"photo": ("chart.png", chart_buf, "image/png")}
                data = {
                    "chat_id": chat_id,
                    "caption": caption,
                    "parse_mode": "HTML"
                }
                
                try:
                    resp = requests.post(url, data=data, files=files, timeout=15)
                    if resp.status_code == 200:
                        sent_with_photo = True
                        success_count += 1
                    else:
                        logger.warning(f"sendPhoto thất bại cho {chat_id} ({resp.status_code}), chuyển qua sendMessage...")
                except Exception as e:
                    logger.error(f"Lỗi khi gửi ảnh tới {chat_id}: {e}")

            # Fallback: Nếu không có ảnh hoặc gửi ảnh thất bại, gửi tin nhắn chữ
            if not sent_with_photo:
                if self.send_message_to_user(caption, chat_id):
                    success_count += 1
            
            # Tránh vi phạm giới hạn tốc độ của Telegram API (khoảng 30 tin/giây)
            time.sleep(0.05)

        logger.success(f"Đã broadcast tín hiệu tới {success_count}/{len(chat_ids)} người dùng thành công!")
        return success_count > 0