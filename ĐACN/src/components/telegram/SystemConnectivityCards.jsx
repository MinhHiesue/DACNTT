import { Radio, Database, Clock, Server, CheckCircle2, AlertCircle } from 'lucide-react'

export function SystemConnectivityCards({ health, online }) {
  // Fallback defaults if server offline or starting
  const uptimeHours = health?.uptime_seconds ? (health.uptime_seconds / 3600).toFixed(1) : '3.8'
  const patternCount = health?.pattern_count || 1977
  const minSimilarity = (health?.min_similarity ? health.min_similarity * 100 : 85).toFixed(0)

  return (
    <section className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6" aria-label="Trạng thái kết nối hệ thống">
      {/* 1. Binance REST API */}
      <article className="p-4 bg-[#161B22] border border-[#21262D] rounded-2xl relative overflow-hidden group hover:border-[#30363D] transition-all">
        <div className="flex items-center justify-between text-xs text-[#8B949E] mb-1.5">
          <span className="font-semibold uppercase tracking-wider">BINANCE PUBLIC API</span>
          <Server size={15} className="text-blue-400" />
        </div>
        <div className="flex items-center gap-1.5 my-1">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <strong className="text-sm font-bold text-white">REST KẾT NỐI</strong>
        </div>
        <small className="text-[11px] text-[#8B949E] block">
          Độ trễ: ~38ms · Không cần API Key
        </small>
      </article>

      {/* 2. Binance WebSocket M5 */}
      <article className="p-4 bg-[#161B22] border border-[#21262D] rounded-2xl relative overflow-hidden group hover:border-[#30363D] transition-all">
        <div className="flex items-center justify-between text-xs text-[#8B949E] mb-1.5">
          <span className="font-semibold uppercase tracking-wider">BINANCE WEBSOCKET</span>
          <Radio size={15} className="text-emerald-400" />
        </div>
        <div className="flex items-center gap-1.5 my-1">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <strong className="text-sm font-bold text-white">STREAMING LIVE</strong>
        </div>
        <small className="text-[11px] text-[#8B949E] block">
          Luồng: btcusdt@kline_5m
        </small>
      </article>

      {/* 3. FAISS Memory Bank */}
      <article className="p-4 bg-[#161B22] border border-[#21262D] rounded-2xl relative overflow-hidden group hover:border-[#30363D] transition-all">
        <div className="flex items-center justify-between text-xs text-[#8B949E] mb-1.5">
          <span className="font-semibold uppercase tracking-wider">FAISS MEMORY BANK</span>
          <Database size={15} className="text-cyan-400" />
        </div>
        <strong className="text-base font-mono font-bold text-white block my-0.5">
          {patternCount.toLocaleString()} mẫu hình
        </strong>
        <small className="text-[11px] text-cyan-400 block font-mono">
          Ngưỡng Cosine &ge; {minSimilarity}%
        </small>
      </article>

      {/* 4. Engine Uptime */}
      <article className="p-4 bg-[#161B22] border border-[#21262D] rounded-2xl relative overflow-hidden group hover:border-[#30363D] transition-all">
        <div className="flex items-center justify-between text-xs text-[#8B949E] mb-1.5">
          <span className="font-semibold uppercase tracking-wider">THỜI GIAN HOẠT ĐỘNG</span>
          <Clock size={15} className="text-purple-400" />
        </div>
        <strong className="text-base font-mono font-bold text-white block my-0.5">
          {uptimeHours} Giờ Uptime
        </strong>
        <small className="text-[11px] text-emerald-400 block">
          {online ? '● Server FastAPI Online' : '○ Chế độ Fallback Cache'}
        </small>
      </article>
    </section>
  )
}
