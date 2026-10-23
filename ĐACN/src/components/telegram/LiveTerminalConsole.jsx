import { useState, useRef, useEffect } from 'react'
import { Terminal, Trash2, ArrowDown, Shield, Copy, Check } from 'lucide-react'

export function LiveTerminalConsole({ customLogs = [] }) {
  const [filterLevel, setFilterLevel] = useState('ALL')
  const [autoScroll, setAutoScroll] = useState(true)
  const [copied, setCopied] = useState(false)
  const scrollRef = useRef(null)

  // Default operational logs reflecting Signal_Trade real event lifecycle
  const initialLogs = [
    { id: 1, time: '19:00:00', level: 'INFO', msg: 'Khởi tạo Signal_Trade Engine v2.0 (Binance Futures XAUUSDT M5 Mode)' },
    { id: 2, time: '19:00:01', level: 'INFO', msg: 'Nạp Memory Bank: 1,230 vector 49 chiều từ winning_patterns.parquet' },
    { id: 3, time: '19:00:02', level: 'SUCCESS', msg: 'Kết nối Binance Futures WebSocket thành công: stream xauusdt@kline_5m' },
    { id: 4, time: '19:05:00', level: 'INFO', msg: '--- PHÁT HIỆN ĐÓNG NẾN M5: Close = 4,005.50 USD ---' },
    { id: 5, time: '19:05:01', level: 'INFO', msg: 'Module 1 Volume Filter: Vol = 1,420 Oz ∈ [P20=840, P85=3,700] → PASS' },
    { id: 6, time: '19:05:01', level: 'INFO', msg: 'Module 2 Feature Extractor: Trích xuất vector 49 chiều chuẩn hóa L2' },
    { id: 7, time: '19:05:02', level: 'SUCCESS', msg: 'Module 3 FAISS Engine: 16 mẫu hình ký ức khớp (Độ đồng thuận 88.5% LONG)' },
    { id: 8, time: '19:05:02', level: 'SUCCESS', msg: 'Module 4 Risk Manager: Swing Low SL=3,996.50, TP=4,019.00, R:R=1.50 → APPROVED' },
    { id: 9, time: '19:05:03', level: 'SUCCESS', msg: 'Telegram Notifier: Bắn bản tin HTML kèm biểu đồ snapshot 15 nến setup tới Bot' },
    { id: 10, time: '19:10:00', level: 'INFO', msg: 'Hệ thống đang chờ đợi nến M5 tiếp theo...' }
  ]

  const [logs, setLogs] = useState(initialLogs)

  // Merge custom logs if provided
  useEffect(() => {
    if (customLogs.length > 0) {
      setLogs((prev) => [...prev, ...customLogs])
    }
  }, [customLogs])

  // Auto scroll to bottom
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  const filteredLogs = logs.filter((log) => {
    if (filterLevel === 'ALL') return true
    return log.level === filterLevel
  })

  const handleCopyLogs = () => {
    const text = filteredLogs.map((l) => `[${l.time}] [${l.level}] ${l.msg}`).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClearLogs = () => {
    setLogs([])
  }

  return (
    <article className="p-5 bg-[#090D16] border border-[#21262D] rounded-2xl shadow-2xl text-[#E6EDF3] font-mono">
      {/* Terminal Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#21262D]">
        <div className="flex items-center gap-2">
          {/* Fake window buttons */}
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-3 h-3 rounded-full bg-[#FF5F56] inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E] inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#27C93F] inline-block" />
          </div>
          <Terminal size={16} className="text-cyan-400" />
          <h3 className="text-xs font-bold tracking-wider text-white uppercase">
            LIVE SYSTEM TERMINAL LOGS
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#161B22] text-[#8B949E] border border-[#30363D]">
            bash · signal_trade.log
          </span>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Level Filter */}
          <div className="flex items-center bg-[#161B22] p-0.5 rounded-lg border border-[#30363D] text-[11px]">
            {['ALL', 'INFO', 'SUCCESS', 'WARN'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  filterLevel === lvl
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-[#8B949E] hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <button
            onClick={() => setAutoScroll((prev) => !prev)}
            className={`p-1.5 px-2 rounded-lg text-[11px] font-semibold border flex items-center gap-1 transition-colors ${
              autoScroll
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-[#161B22] text-[#8B949E] border-[#30363D]'
            }`}
            title="Tự động cuộn theo log mới"
          >
            <ArrowDown size={12} />
            <span className="hidden sm:inline">Auto-scroll</span>
          </button>

          <button
            onClick={handleCopyLogs}
            className="p-1.5 px-2 bg-[#161B22] hover:bg-[#21262D] text-[#8B949E] hover:text-white rounded-lg border border-[#30363D] text-[11px] flex items-center gap-1 transition-colors"
            title="Sao chép toàn bộ log"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span className="hidden sm:inline">{copied ? 'Đã chép' : 'Copy'}</span>
          </button>

          <button
            onClick={handleClearLogs}
            className="p-1.5 px-2 bg-[#161B22] hover:bg-[#21262D] text-[#8B949E] hover:text-rose-400 rounded-lg border border-[#30363D] text-[11px] flex items-center gap-1 transition-colors"
            title="Xóa toàn bộ dòng log"
          >
            <Trash2 size={12} />
            <span className="hidden sm:inline">Xóa log</span>
          </button>
        </div>
      </div>

      {/* Terminal Content Screen */}
      <div
        ref={scrollRef}
        className="h-64 overflow-y-auto p-3 text-xs leading-relaxed space-y-1 my-2 bg-[#05080E] rounded-xl border border-[#161B22]"
      >
        {filteredLogs.map((log) => {
          const isSuccess = log.level === 'SUCCESS'
          const isInfo = log.level === 'INFO'
          const isWarn = log.level === 'WARN'
          const isError = log.level === 'ERROR'

          return (
            <div key={log.id} className="flex items-start gap-2 hover:bg-white/5 py-0.5 px-1 rounded transition-colors">
              <span className="text-[#8B949E] shrink-0">[{log.time}]</span>
              <span
                className={`font-bold shrink-0 px-1 rounded text-[10px] ${
                  isSuccess
                    ? 'bg-emerald-500/20 text-[#089981]'
                    : isInfo
                      ? 'bg-blue-500/20 text-cyan-400'
                      : isWarn
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                [{log.level}]
              </span>
              <span
                className={
                  isSuccess
                    ? 'text-[#C9D1D9]'
                    : isWarn
                      ? 'text-yellow-200'
                      : isError
                        ? 'text-rose-300'
                        : 'text-[#8B949E]'
                }
              >
                {log.msg}
              </span>
            </div>
          )
        })}
        {filteredLogs.length === 0 && (
          <div className="text-center py-12 text-[#8B949E]">
            Console trống. Chưa có dòng sự kiện nào.
          </div>
        )}
      </div>

      {/* Terminal Status Foot */}
      <div className="flex items-center justify-between text-[11px] text-[#8B949E] pt-2 border-t border-[#161B22]">
        <span className="flex items-center gap-1">
          <Shield size={12} className="text-emerald-400" />
          Hệ thống ghi log xoay vòng tại thư mục Signal_Trade/logs/ (Uvicorn + Loguru Engine).
        </span>
        <span>{filteredLogs.length} dòng sự kiện</span>
      </div>
    </article>
  )
}
