import React, { useState } from 'react'
import { Check, Send, ExternalLink } from 'lucide-react'

// Nhận thêm prop userId (truyền từ App hoặc Context/Redux)
export function TelegramConfigForm({ connected, onConnectionChange, userId }) {
  const [signalsEnabled, setSignalsEnabled] = useState(true)
  const [dailySummary, setDailySummary] = useState(false)
  const [chatId, setChatId] = useState('')
  const [feedback, setFeedback] = useState('')
  const [saved, setSaved] = useState(false)

  // CẤU HÌNH BOT CỦA BẠN TẠI ĐÂY
  const botUsername = "YourGoldSignalBot"; // Đổi thành username bot thật của bạn (không có @)
  const telegramLink = userId 
    ? `https://t.me/${botUsername}?start=${userId}` 
    : `https://t.me/${botUsername}`;

  const handleConnectionChange = (value) => {
    onConnectionChange(value)
    setSaved(false)
    setFeedback('')
  }

  const sendTest = () => {
    setSaved(false)
    setFeedback(!connected
      ? 'Vui lòng bật trạng thái Bot trước khi gửi thử.'
      : 'Đã gửi lệnh test. Vui lòng kiểm tra Telegram của bạn.')
  }

  const saveConfiguration = () => {
    setSaved(true)
    setFeedback('Đã lưu cấu hình thông báo thành công.')
  }

  return (
    <section className="panel telegram-config">
      <div className="utility-section-heading">
        <div>
          <div className="panel-kicker">BOT STATUS</div>
          <h2>Kết nối Telegram Bot</h2>
        </div>
        <label className="switch-control">
          <input 
            aria-label="Bật Telegram Bot" 
            type="checkbox" 
            checked={connected} 
            onChange={(event) => handleConnectionChange(event.target.checked)} 
          />
          <span />
        </label>
      </div>
      
      <p className="telegram-intro">
        Kết nối tài khoản web với Telegram để nhận cảnh báo tín hiệu vàng M5 tự động ngay lập tức.
      </p>

      {/* Khu vực Nút Kết Nối (Thay thế cho việc nhập Chat ID thủ công) */}
      <div style={{ marginBottom: '24px', marginTop: '16px' }}>
        <a 
          href={telegramLink} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="primary-action"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
        >
          <ExternalLink size={16} /> Kết nối ngay với Telegram
        </a>
      </div>

      <label className="form-field">CHAT ID (Tùy chọn)
        <input 
          value={chatId} 
          onChange={(event) => { setChatId(event.target.value); setSaved(false); }} 
          placeholder="Tự động lấy sau khi bạn kết nối ở trên" 
        />
      </label>

      <div className="notification-options">
        <label>
          <span><strong>Thông báo tín hiệu</strong><small>Nhận bản tin BUY, SELL và HOLD</small></span>
          <span className="switch-control">
            <input 
              aria-label="Thông báo tín hiệu" 
              type="checkbox" 
              checked={signalsEnabled} 
              onChange={(event) => setSignalsEnabled(event.target.checked)} 
            />
            <span />
          </span>
        </label>
        <label>
          <span><strong>Tóm tắt hằng ngày</strong><small>Bản tổng kết thị trường lúc 08:00</small></span>
          <span className="switch-control">
            <input 
              aria-label="Tóm tắt hằng ngày" 
              type="checkbox" 
              checked={dailySummary} 
              onChange={(event) => setDailySummary(event.target.checked)} 
            />
            <span />
          </span>
        </label>
      </div>

      <div className="telegram-actions">
        <button className="outline-button" onClick={sendTest}>
          <Send size={14} /> Gửi thử
        </button>
        <button className="primary-action" onClick={saveConfiguration}>
          <Check size={14} /> Lưu cấu hình
        </button>
      </div>
      
      {feedback && (
        <div className={`inline-feedback ${saved ? 'feedback-success' : ''}`} role="status">
          {feedback}
        </div>
      )}
    </section>
  )
}