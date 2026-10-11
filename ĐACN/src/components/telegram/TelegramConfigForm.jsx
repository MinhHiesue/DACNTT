import { useState } from 'react'
import { Check, Send } from 'lucide-react'

export function TelegramConfigForm({ connected, onConnectionChange }) {
  const [signalsEnabled, setSignalsEnabled] = useState(true)
  const [dailySummary, setDailySummary] = useState(false)
  const [chatId, setChatId] = useState('-1001234567890')
  const [feedback, setFeedback] = useState('')
  const [saved, setSaved] = useState(false)

  const handleConnectionChange = (value) => {
    onConnectionChange(value)
    setSaved(false)
    setFeedback('')
  }

  const handleChatIdChange = (value) => {
    setChatId(value)
    setSaved(false)
  }

  const sendTest = () => {
    setSaved(false)
    setFeedback(!connected
      ? 'Bật bot trước khi gửi thử.'
      : chatId.trim()
        ? 'Tin nhắn thử đã được mô phỏng thành công.'
        : 'Nhập Chat ID trước khi gửi thử.')
  }

  const saveConfiguration = () => {
    setSaved(true)
    setFeedback('Cấu hình đã lưu trong phiên demo.')
  }

  return (
    <section className="panel telegram-config">
      <div className="utility-section-heading">
        <div><div className="panel-kicker">BOT STATUS</div><h2>Kết nối bot</h2></div>
        <label className="switch-control"><input aria-label="Bật Telegram Bot" type="checkbox" checked={connected} onChange={(event) => handleConnectionChange(event.target.checked)} /><span /></label>
      </div>
      <p className="telegram-intro">Trạng thái và thao tác dưới đây chỉ mô phỏng trong trình duyệt. Chưa có tin nhắn nào được gửi.</p>
      <label className="form-field">CHAT ID<input value={chatId} onChange={(event) => handleChatIdChange(event.target.value)} placeholder="Nhập Chat ID" /></label>
      <div className="notification-options">
        <label><span><strong>Thông báo tín hiệu</strong><small>Nhận bản tin BUY, SELL và HOLD mẫu</small></span><span className="switch-control"><input aria-label="Thông báo tín hiệu" type="checkbox" checked={signalsEnabled} onChange={(event) => onSignalsEnabledChange(event.target.checked)} /><span /></span></label>
        <label><span><strong>Tóm tắt hằng ngày</strong><small>Bản tổng kết thị trường lúc 08:00</small></span><span className="switch-control"><input aria-label="Tóm tắt hằng ngày" type="checkbox" checked={dailySummary} onChange={(event) => onDailySummaryChange(event.target.checked)} /><span /></span></label>
      </div>
      <div className="telegram-actions">
        <button className="outline-button" onClick={sendTest}><Send size={14} /> Gửi thử</button>
        <button className="primary-action" onClick={saveConfiguration}><Check size={14} /> Lưu cấu hình</button>
      </div>
      {feedback && <div className={`inline-feedback ${saved ? 'feedback-success' : ''}`} role="status">{feedback}</div>}
    </section>
  )
}
