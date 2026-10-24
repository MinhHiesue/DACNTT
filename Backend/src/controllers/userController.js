import { User } from '../models/User.js';

export const linkTelegram = async (req, res) => {
  try {
    const { userId, telegramChatId } = req.body;

    if (!userId || !telegramChatId) {
      return res.status(400).json({ success: false, message: 'Thiếu userId hoặc telegramChatId' });
    }

    // Tìm và cập nhật user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        telegramChatId: telegramChatId,
        telegramIsActive: true 
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    res.status(200).json({ success: true, message: 'Đã liên kết Telegram thành công' });
  } catch (error) {
    console.error('Lỗi khi link telegram:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};