import { useState } from 'react'
import { ShieldCheck, RefreshCw, Radio } from 'lucide-react'
import { SystemConnectivityCards } from '../components/telegram/SystemConnectivityCards.jsx'
import { TelegramBotControl } from '../components/telegram/TelegramBotControl.jsx'
import { LiveTerminalConsole } from '../components/telegram/LiveTerminalConsole.jsx'
import { useSystemHealth } from '../hooks/useSystemHealth.js'

export function TelegramPage() {
  const { health, online, loading, checkHealth } = useSystemHealth(8000)
  const [runtimeLogs, setRuntimeLogs] = useState([])

  const handleLogEvent = (event) => {
    const now = new Date()
    const timeStr = now.toTimeString().split(' ')[0]
    setRuntimeLogs((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        time: timeStr,
        level: event.level,
        msg: event.message
      }
    ])
  }

  return (
    <div className="utility-page">
      {/* Page Heading */}
      <section className="signals-page-heading mb-6">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" /> OPERATION & TELEGRAM BOT HUB
            <span className="heading-time">BINANCE M5 LIVE DISPATCHER</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Giám sát vận hành & Telegram Bot<span>.</span>
          </h1>
          <p className="page-subtitle text-xs text-[#8B949E] mt-1">
            Theo dõi tình trạng kết nối tới Binance API, quản lý cơ chế phát tín hiệu tự động và kiểm tra Telegram Bot.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#161B22] border border-[#21262D] text-xs font-semibold text-emerald-400">
            <Radio size={13} className="animate-pulse" />
            <span>{online ? 'HỆ THỐNG ONLINE' : 'CHẾ ĐỘ NGOẠI TUYẾN'}</span>
          </div>

          <button
            onClick={() => checkHealth()}
            className="p-2 bg-[#161B22] hover:bg-[#21262D] text-[#8B949E] hover:text-white rounded-xl border border-[#21262D] transition-colors"
            title="Kiểm tra kết nối tức thì"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </section>

      {/* 1. Connectivity Status Cards */}
      <SystemConnectivityCards health={health} online={online} />

      {/* 2. Telegram Bot Control Panel & Live Preview */}
      <TelegramBotControl onLogEvent={handleLogEvent} />

      {/* 3. Live Terminal Logs Console */}
      <LiveTerminalConsole customLogs={runtimeLogs} />

      {/* Footer */}
      <footer className="page-footer mt-8">
        <span>© 2026 NORTHSTAR AI TRADING ENGINE</span>
        <span>
          <ShieldCheck size={12} /> CƠ CHẾ BẢO MẬT API KEY · KHÔNG LƯU TOKEN PHÍA FRONTEND
        </span>
        <span>TELEGRAM DISPATCHER v2.0</span>
      </footer>
    </div>
  )
}
