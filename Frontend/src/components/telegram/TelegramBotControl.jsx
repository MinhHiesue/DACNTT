import { useState } from 'react'
import { Send, CheckCircle2, AlertTriangle, RefreshCw, MessageSquare, ShieldCheck, Sparkles, Image as ImageIcon } from 'lucide-react'
import { sendTelegramTestAlert } from '../../api/client.js'
import { TelegramConfigForm } from './TelegramConfigForm.jsx'

// Nhận prop userId từ TelegramPage
export function TelegramBotControl({ onLogEvent, userId }) {
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  
  // State quản lý trạng thái bật/tắt bot
  const [connected, setConnected] = useState(false)

  const handleSendTest = async () => {
    setSending(true)
    setResult(null)
    onLogEvent?.({
      level: 'INFO',
      message: 'Khởi tạo gửi bản tin kiểm tra tới Telegram API...'
    })

    try {
      const res = await sendTelegramTestAlert()
      setResult({
        success: res.success,
        message: res.message
      })

      if (res.success) {
        onLogEvent?.({
          level: 'SUCCESS',
          message: 'Đã gửi thành công bản tin HTML kèm biểu đồ snapshot tới Telegram Bot!'
        })
      } else {
        onLogEvent?.({
          level: 'WARN',
          message: res.message || 'Chưa cấu hình TELEGRAM_BOT_TOKEN trong file .env (Đã mô phỏng)'
        })
      }
    } catch (err) {
      setResult({
        success: false,
        message: `Lỗi kết nối tới Backend: ${err.message}`
      })
      onLogEvent?.({
        level: 'ERROR',
        message: `Lỗi khi gọi API Telegram: ${err.message}`
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <article className="p-5 bg-[#0D1117] border border-[#21262D] rounded-2xl shadow-xl text-[#E6EDF3] mb-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#21262D]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
            <MessageSquare size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-white uppercase">
                CẤU HÌNH & KIỂM THỬ TELEGRAM BOT HUB
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                ACTIVE DISPATCHER
              </span>
            </div>
            <p className="text-xs text-[#8B949E]">
              Tự động chụp biểu đồ nến M5 và bắn cảnh báo ngay khi phát hiện mẫu hình đạt chuẩn
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div>
          <button
            onClick={handleSendTest}
            disabled={sending}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md hover:shadow-cyan-500/20"
          >
            {sending ? (
              <RefreshCw size={13} className="animate-spin text-white" />
            ) : (
              <Send size={13} />
            )}
            <span>{sending ? 'Đang gửi...' : 'Gửi cảnh báo thử nghiệm (Kèm Chart)'}</span>
          </button>
        </div>
      </div>

      {/* Result Alert Banner if present */}
      {result && (
        <div
          className={`my-3 p-3 rounded-xl border text-xs flex items-start gap-2 animate-fade-in ${
            result.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
          }`}
        >
          {result.success ? (
            <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
          ) : (
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-yellow-400" />
          )}
          <div className="leading-relaxed">{result.message}</div>
        </div>
      )}

      {/* Configuration & Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4">
        {/* Left Col: Bot Parameters & Connection Form (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Form Kết Nối Mới Tích Hợp */}
          <TelegramConfigForm 
            connected={connected}
            onConnectionChange={setConnected}
            userId={userId} 
          />

          <div className="p-4 bg-[#161B22] border border-[#21262D] rounded-xl flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E] block mb-3">
                THÔNG SỐ KẾT NỐI BOT
              </span>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#21262D]">
                  <span className="text-[#8B949E]">Bot Username:</span>
                  <span className="font-mono text-cyan-300 font-bold">@NorthstarPatternBot</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-[#21262D]">
                  <span className="text-[#8B949E]">Chat ID nhận tin:</span>
                  <span className="font-mono text-white">-100******4890</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-[#21262D]">
                  <span className="text-[#8B949E]">Định dạng cảnh báo:</span>
                  <span className="text-white font-semibold">HTML Message + PNG Snapshot</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-[#21262D]">
                  <span className="text-[#8B949E]">Điều kiện gửi:</span>
                  <span className="text-[#089981] font-semibold">Chỉ gửi lệnh APPROVED</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#21262D] text-[11px] text-[#8B949E] flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
              <span>Token được bảo vệ trong biến môi trường .env phía Backend.</span>
            </div>
          </div>
        </div>

        {/* Right Col: Telegram Message Bubble Preview (7 cols) */}
        <div className="lg:col-span-7 p-4 bg-[#161B22] border border-[#21262D] rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E] flex items-center gap-1.5">
              <Sparkles size={13} className="text-yellow-400" /> XEM TRƯỚC BẢN TIN TRÊN TELEGRAM
            </span>
            <span className="text-[10px] text-[#8B949E] font-mono">19:05:00 UTC</span>
          </div>

          {/* Telegram Chat Bubble */}
          <div className="p-3.5 bg-[#0e1621] border border-[#242f3d] rounded-2xl max-w-lg text-xs leading-relaxed text-[#f5f5f5] shadow-lg">
            <div className="font-bold text-sm text-[#40a7e3] mb-1">
              🚀 NORTHSTAR AI PATTERN ALERT
            </div>

            <div className="my-1.5 font-bold text-sm text-[#089981]">
              🎯 BTC/USDT M5 — TÍN HIỆU ĐƯỢC DUYỆT: BUY / LONG
            </div>

            <div className="space-y-0.5 text-xs font-mono my-2 text-[#d1d5db]">
              <div><b>Entry:</b> $67,482.35 (Đóng nến M5)</div>
              <div><b>Stop Loss:</b> $67,062.35 (-$420.00 USD)</div>
              <div><b>Take Profit:</b> $68,112.35 (+$630.00 USD)</div>
              <div><b>Tỷ lệ Reward/Risk:</b> 1.50</div>
              <div><b>Rủi ro đề xuất:</b> 1.0% Vốn ($100 USD)</div>
            </div>

            <div className="pt-1.5 border-t border-[#242f3d] text-[11px] text-[#8B949E]">
              🧠 <b>Ký ức FAISS:</b> Khớp 14 mẫu thắng lịch sử (Cosine 87.5%)
            </div>

            {/* Mock Chart Image Snapshot in Telegram preview */}
            <div className="mt-2.5 p-2 bg-[#17212b] border border-[#242f3d] rounded-xl flex items-center justify-center gap-2 text-[11px] text-[#40a7e3]">
              <ImageIcon size={14} />
              <span>[Hình ảnh biểu đồ 15 nến setup đính kèm: snapshot_btc.png]</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}