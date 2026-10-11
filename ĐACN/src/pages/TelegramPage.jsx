import { useState } from 'react'
import { PageHeading } from '../components/PageHeading.jsx'
import { TelegramConfigForm } from '../components/telegram/TelegramConfigForm.jsx'
import { TelegramStatusPanel } from '../components/telegram/TelegramStatusPanel.jsx'

export function TelegramPage() {
  const [connected, setConnected] = useState(true)

  return (
    <div className="utility-page">
      <PageHeading eyebrow="TELEGRAM INTEGRATION" title="Telegram Bot" subtitle="Cấu hình thông báo trong giao diện demo, chưa kết nối Telegram thật." badge={connected ? 'ĐANG BẬT · DEMO' : 'ĐANG TẮT'} />
      <div className="telegram-layout">
        <TelegramConfigForm connected={connected} onConnectionChange={setConnected} />
        <TelegramStatusPanel connected={connected} />
      </div>
    </div>
  )
}
