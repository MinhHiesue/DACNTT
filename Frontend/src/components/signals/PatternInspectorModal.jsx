import { useEffect, useState } from 'react'
import { X, Brain, CheckCircle2, TrendingUp, TrendingDown, Layers, Sparkles } from 'lucide-react'
import { formatSignalPrice } from '../../data/signalUtils.js'

export function PatternInspectorModal({ isOpen, onClose, signal, inspectorData }) {
  const [selectedPatternIndex, setSelectedPatternIndex] = useState(0)

  if (!isOpen) return null

  const currentCurve = inspectorData?.current_curve || [0, 10, -5, 20, 35, 15, 40, 55, 30, 45, 60, 50, 70, 85, 90]
  const matchedPatterns = inspectorData?.matched_patterns || [
    {
      id: 148,
      direction: signal?.direction || 'LONG',
      similarity: 0.934,
      max_favorable_move: 780.0,
      entry_price: 64500.0,
      timestamp: '2024-09-12 14:35:00 UTC',
      normalized_curve: [0, 8, -2, 18, 30, 20, 38, 50, 35, 48, 65, 55, 75, 80, 92]
    },
    {
      id: 219,
      direction: signal?.direction || 'LONG',
      similarity: 0.912,
      max_favorable_move: 650.0,
      entry_price: 63800.0,
      timestamp: '2024-09-18 09:15:00 UTC',
      normalized_curve: [0, 12, -8, 15, 28, 18, 35, 48, 32, 42, 58, 48, 68, 78, 88]
    },
    {
      id: 305,
      direction: signal?.direction || 'LONG',
      similarity: 0.887,
      max_favorable_move: 590.0,
      entry_price: 65100.0,
      timestamp: '2024-09-24 16:20:00 UTC',
      normalized_curve: [0, 5, -3, 22, 32, 22, 42, 52, 28, 40, 62, 52, 72, 82, 86]
    }
  ]

  const activePattern = matchedPatterns[selectedPatternIndex] || matchedPatterns[0]

  // Tính scale chuẩn hóa để vẽ SVG Curve
  const allValues = [...currentCurve, ...(activePattern?.normalized_curve || [])]
  const minVal = Math.min(...allValues, 0)
  const maxVal = Math.max(...allValues, 10)
  const range = (maxVal - minVal) || 1

  const width = 640
  const height = 220
  const padding = 24

  const getPoints = (curve) => {
    return curve.map((val, idx) => {
      const x = padding + (idx / (curve.length - 1)) * (width - 2 * padding)
      const y = height - padding - ((val - minVal) / range) * (height - 2 * padding)
      return `${x},${y}`
    }).join(' ')
  }

  const currentPoints = getPoints(currentCurve)
  const historyPoints = activePattern?.normalized_curve ? getPoints(activePattern.normalized_curve) : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0D1117] border border-[#30363D] rounded-2xl shadow-2xl p-6 text-[#E6EDF3]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#21262D]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
              <Brain size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">Pattern Memory Inspector</h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  FAISS Cosine Similarity
                </span>
              </div>
              <p className="text-xs text-[#8B949E]">
                Soi chiếu 15 nến hiện tại với các mẫu hình chiến thắng lớn trong ký ức lịch sử
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8B949E] hover:text-white rounded-lg hover:bg-[#21262D] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Overview Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
          <div className="p-3 bg-[#161B22] border border-[#21262D] rounded-xl">
            <span className="text-[11px] text-[#8B949E] block mb-1">HƯỚNG ĐỒNG THUẬN</span>
            <div className="flex items-center gap-1.5 font-bold text-sm">
              {signal?.direction === 'LONG' ? (
                <span className="text-[#089981] flex items-center gap-1"><TrendingUp size={16} /> BUY / LONG</span>
              ) : (
                <span className="text-[#F23645] flex items-center gap-1"><TrendingDown size={16} /> SELL / SHORT</span>
              )}
            </div>
          </div>
          <div className="p-3 bg-[#161B22] border border-[#21262D] rounded-xl">
            <span className="text-[11px] text-[#8B949E] block mb-1">ĐỘ ĐỒNG THUẬN KÝ ỨC</span>
            <span className="font-bold text-sm text-cyan-400">
              {(signal?.confidence ? (signal.confidence <= 1 ? signal.confidence * 100 : signal.confidence).toFixed(1) : '87.5')}%
            </span>
          </div>
          <div className="p-3 bg-[#161B22] border border-[#21262D] rounded-xl">
            <span className="text-[11px] text-[#8B949E] block mb-1">MẪU HÌNH TƯƠNG ĐỒNG</span>
            <span className="font-bold text-sm text-white">
              {signal?.matched_count || matchedPatterns.length} mẫu lịch sử
            </span>
          </div>
          <div className="p-3 bg-[#161B22] border border-[#21262D] rounded-xl">
            <span className="text-[11px] text-[#8B949E] block mb-1">COSINE CAO NHẤT</span>
            <span className="font-bold text-sm text-[#089981]">
              {(activePattern?.similarity * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Visual Curve Comparison Canvas */}
        <div className="p-4 bg-[#161B22] border border-[#21262D] rounded-xl mb-5">
          <div className="flex items-center justify-between mb-3 text-xs">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
                <span className="w-3 h-0.5 bg-cyan-400 inline-block rounded" />
                Đường cong giá 15 nến hiện tại (Δ Close)
              </span>
              <span className="flex items-center gap-1.5 text-[#089981] font-medium">
                <span className="w-3 h-0.5 bg-[#089981] border-b border-dashed inline-block" />
                Mẫu hình ký ức #{activePattern?.id} ({activePattern?.timestamp})
              </span>
            </div>
            <span className="text-[#8B949E] text-[11px]">Cửa sổ setup: 15 nến M5 (t-14 → t)</span>
          </div>

          <div className="w-full overflow-hidden bg-[#0D1117] rounded-lg border border-[#21262D] p-2">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48">
              {/* Grid lines */}
              <line x1={padding} y1={height/2} x2={width-padding} y2={height/2} stroke="#21262D" strokeDasharray="3 3" />
              
              {/* Historical Matched Pattern Curve (Green Dashed) */}
              {historyPoints && (
                <polyline
                  fill="none"
                  stroke="#089981"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  points={historyPoints}
                />
              )}

              {/* Current 15-Bar Curve (Solid Cyan) */}
              <polyline
                fill="none"
                stroke="#00E5FF"
                strokeWidth="3"
                points={currentPoints}
              />
            </svg>
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-[#8B949E]">
            <span>Nến t-14 (Khởi đầu chu kỳ setup)</span>
            <span>Nến t (Thời điểm đóng nến phát tín hiệu)</span>
          </div>
        </div>

        {/* Matched Historical Patterns Table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#8B949E] tracking-wider uppercase flex items-center gap-1.5">
              <Layers size={14} className="text-blue-400" />
              DANH SÁCH MẪU HÌNH THẮNG TRONG KÝ ỨC (TOP MATCHES)
            </span>
            <span className="text-xs text-[#8B949E]">Chọn 1 hàng để so chiếu đồ thị</span>
          </div>

          <div className="border border-[#21262D] rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161B22] text-[#8B949E] border-b border-[#21262D]">
                <tr>
                  <th className="p-3">MẪU HÌNH</th>
                  <th className="p-3">THỜI GIAN XẢY RA</th>
                  <th className="p-3">HƯỚNG ĐI</th>
                  <th className="p-3">ĐỘ TƯƠNG ĐỒNG</th>
                  <th className="p-3">LÃI TỐI ĐA ĐẠT ĐƯỢC</th>
                  <th className="p-3 text-right">HÀNH ĐỘNG</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262D]">
                {matchedPatterns.map((pat, idx) => (
                  <tr
                    key={pat.id}
                    onClick={() => setSelectedPatternIndex(idx)}
                    className={`cursor-pointer transition-colors ${
                      selectedPatternIndex === idx
                        ? 'bg-blue-500/10 text-white'
                        : 'hover:bg-[#161B22]/70 text-[#C9D1D9]'
                    }`}
                  >
                    <td className="p-3 font-semibold text-white">#{pat.id}</td>
                    <td className="p-3 text-[#8B949E]">{pat.timestamp}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        pat.direction === 'LONG'
                          ? 'bg-[#089981]/20 text-[#089981]'
                          : 'bg-[#F23645]/20 text-[#F23645]'
                      }`}>
                        {pat.direction}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-cyan-400">
                      {(pat.similarity * 100).toFixed(1)}%
                    </td>
                    <td className="p-3 font-semibold text-[#089981]">
                      +${formatSignalPrice(pat.max_favorable_move)} USD
                    </td>
                    <td className="p-3 text-right">
                      {selectedPatternIndex === idx ? (
                        <span className="text-xs text-blue-400 font-bold flex items-center justify-end gap-1">
                          <CheckCircle2 size={13} /> Đang xem
                        </span>
                      ) : (
                        <span className="text-xs text-[#8B949E] hover:text-white">Xem mẫu</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-5 pt-3 border-t border-[#21262D] flex items-center justify-between text-xs text-[#8B949E]">
          <span className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-yellow-400" />
            Thuật toán so khớp: FAISS L2 Normalized Cosine Search ($k \ge 10$, $\text{Similarity} \ge 85\%$).
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-[#21262D] hover:bg-[#30363D] text-white rounded-lg transition-colors"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  )
}
