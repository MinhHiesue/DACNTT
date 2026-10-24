# Signal_Trade/src/data/user_db.py
import os
from typing import List
from pymongo import MongoClient
from loguru import logger
from dotenv import load_dotenv

# Load biến môi trường từ file .env
load_dotenv()

class UserDatabaseManager:
    def __init__(self, mongo_uri: str = None, db_name: str = None):
        """
        Khởi tạo kết nối đến MongoDB.
        Nếu không truyền tham số, sẽ tự động lấy từ biến môi trường MONGO_URI.
        """
        self.mongo_uri = mongo_uri or os.getenv("MONGO_URI", "mongodb://localhost:27017/")
        self.db_name = db_name or os.getenv("DB_NAME", "tmdt_db") # Đổi tên DB cho khớp với dự án MERN của bạn
        
        try:
            self.client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=5000)
            self.db = self.client[self.db_name]
            # Kiểm tra kết nối
            self.client.server_info()
            logger.info(f"Đã kết nối thành công đến MongoDB: {self.db_name}")
        except Exception as e:
            logger.error(f"Lỗi kết nối MongoDB: {e}")
            self.client = None

    def get_active_telegram_chat_ids(self) -> List[str]:
        """
        Truy vấn collection 'users' để lấy tất cả telegramChatId đang active.
        """
        if not self.client:
            logger.warning("Chưa có kết nối MongoDB. Trả về danh sách rỗng.")
            return []

        try:
            # Truy vấn: tìm các user có telegramIsActive = True và telegramChatId tồn tại
            query = {
                "telegramIsActive": True,
                "telegramChatId": {"$ne": None, "$exists": True}
            }
            
            # Chỉ lấy trường telegramChatId để tối ưu hiệu suất
            projection = {"telegramChatId": 1, "_id": 0}
            
            # Lưu ý: Tên collection mặc định của Mongoose thường là dạng số nhiều viết thường của model ('users')
            users_collection = self.db['users']
            
            cursor = users_collection.find(query, projection)
            
            # Trích xuất danh sách chat_ids
            chat_ids = [doc.get("telegramChatId") for doc in cursor if doc.get("telegramChatId")]
            
            logger.info(f"Đã tìm thấy {len(chat_ids)} người dùng đăng ký nhận tín hiệu Telegram.")
            return chat_ids
            
        except Exception as e:
            logger.error(f"Lỗi khi truy vấn danh sách chat_ids: {e}")
            return []