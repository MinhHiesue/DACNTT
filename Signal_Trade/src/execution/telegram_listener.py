"""
Tiến trình lắng nghe Telegram Bot (Listener).
Nhiệm vụ: Bắt lệnh /start <userId> từ link trên Website và gọi về Backend Node.js để lưu kết nối.
"""
import os
import sys
import requests
import telebot
from loguru import logger
from dotenv import load_dotenv

# Đảm bảo chạy được từ thư mục gốc
from pathlib import Path
root_dir = Path(__file__).resolve().parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

# Load biến môi trường từ file Signal_Trade/config/.env
env_path = root_dir / "config" / ".env"
load_dotenv(dotenv_path=env_path)

BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
if not BOT_TOKEN:
    logger.error("LỖI: Chưa cấu hình TELEGRAM_BOT_TOKEN trong file .env")
    sys.exit(1)

bot = telebot.TeleBot(BOT_TOKEN)

# URL API của Backend Node.js (Thay đổi port nếu Backend của bạn chạy port khác 5000)
BACKEND_API_URL = os.getenv('BACKEND_API_URL', 'http://localhost:5000/api/users/link-telegram')

@bot.message_handler(commands=['start'])
def handle_start(message):
    """
    Xử lý khi người dùng bấm Start.
    Nếu đến từ link website, message.text sẽ có dạng: "/start <userId>"
    """
    text_parts = message.text.split()
    chat_id = message.chat.id
    username = message.from_user.username or message.from_user.first_name
    
    # Kịch bản 1: Bấm từ link website sang (Có truyền tham số userId)
    if len(text_parts) > 1:
        user_id_from_web = text_parts[1]
        logger.info(f"Nhận yêu cầu liên kết từ Telegram {username} (Chat ID: {chat_id}) cho User ID web: {user_id_from_web}")
        
        try:
            # Gọi HTTP POST về Backend Node.js
            payload = {
                "userId": user_id_from_web,
                "telegramChatId": str(chat_id)
            }
            response = requests.post(BACKEND_API_URL, json=payload, timeout=10)
            
            if response.status_code == 200:
                bot.reply_to(
                    message, 
                    "✅ <b>Kết nối tài khoản thành công!</b>\n\n"
                    "Từ bây giờ, bạn sẽ nhận được thông báo tín hiệu Vàng M5 tự động tại đây.",
                    parse_mode="HTML"
                )
                logger.success(f"Đã liên kết thành công user_id: {user_id_from_web} với chat_id: {chat_id}")
            else:
                error_msg = response.json().get('message', 'Lỗi không xác định từ server')
                bot.reply_to(message, f"❌ <b>Lỗi kết nối:</b> {error_msg}\n\nVui lòng thử lại từ website.", parse_mode="HTML")
                logger.error(f"Node.js Backend từ chối liên kết: {error_msg}")
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Không thể kết nối đến Backend API ({BACKEND_API_URL}): {e}")
            bot.reply_to(message, "⚠️ Hệ thống server đang bảo trì. Vui lòng thử lại sau ít phút.")
            
    # Kịch bản 2: Người dùng tự tìm bot trên Telegram và chat /start
    else:
        bot.reply_to(
            message, 
            "👋 <b>Chào mừng bạn đến với Hệ thống Cảnh báo Vàng AI!</b>\n\n"
            "Để nhận thông báo, vui lòng truy cập website, đăng nhập và bấm vào nút <b>'Kết nối Telegram'</b>.",
            parse_mode="HTML"
        )

def main():
    logger.info("==================================================")
    logger.info("🤖 KHỞI ĐỘNG TELEGRAM LISTENER")
    logger.info(f"• Backend API Link: {BACKEND_API_URL}")
    logger.info("• Đang chờ kết nối từ người dùng...")
    logger.info("==================================================")
    
    # Bắt đầu vòng lặp lắng nghe vô hạn
    bot.infinity_polling(timeout=10, long_polling_timeout=5)

if __name__ == "__main__":
    main()