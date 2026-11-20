import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { fetchPerformanceTrades, scanLatestSignal, fetchSignalsHistory, fetchKlines } from '../api/client.js'

const TradeSetupContext = createContext(null)

// Sử dụng key v6 sạch sẽ, tách biệt hoàn toàn với cache cũ
const STORAGE_SETUPS_KEY = 'northstar_active_setups_clean_v6'
const STORAGE_USER_TRADES_KEY = 'northstar_user_trades_clean_v6'

// Tự động quét sạch dữ liệu rác/lỗi logic cũ từ localStorage khi khởi động
try {
  localStorage.removeItem('northstar_active_setups_disciplined_v4')
  localStorage.removeItem('northstar_user_closed_trades_v4')
  localStorage.removeItem('northstar_active_setups_clean_v5')
  localStorage.removeItem('northstar_user_trades_clean_v5')
} catch {}

// Âm thanh cảnh báo nhẹ nhàng khi phát hiện Setup Đạt Chuẩn (Web Audio API)
function playAlertChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15) // A5
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.35)
  } catch {
    // Trình duyệt có thể chặn autoplay âm thanh khi chưa tương tác
  }
}

// KHỞI ĐẦU: KHÔNG MOCK BẤT KỲ SETUP NÀO
const EMPTY_SETUPS = {
  BTCUSDT: null,
  XAUUSDT: null
}

export function TradeSetupProvider({ children }) {
  // 1. Quản lý tối đa 2 setup: 1 XAUUSDT, 1 BTCUSDT
  const [setups, setSetups] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETUPS_KEY)
      return saved ? JSON.parse(saved) : EMPTY_SETUPS
    } catch {
      return EMPTY_SETUPS
    }
  })

  // 2. Trạng thái Radar quét nền liên tục 24/7 (Continuous Scanner HUD)
  const [radarState, setRadarState] = useState({
    scanCount: 1,
    lastSymbolScanned: 'BTC/USDT',
    alertBanner: null, // { message, signal }
    isScanning: true
  })

  const dismissRadarAlert = useCallback(() => {
    setRadarState((prev) => ({ ...prev, alertBanner: null }))
  }, [])

  // 3. Chẩn đoán quét nến gần nhất (Scan Diagnostics)
  const [lastScanResult, setLastScanResult] = useState({
    symbol: 'BTCUSDT',
    timestamp: null,
    currentPrice: 0,
    status: 'IDLE', // 'IDLE' | 'ANALYZING' | 'APPROVED' | 'REJECTED'
    reason: '',
    message: 'Radar đang chạy ngầm liên tục để thẩm định cấu trúc nến M5.'
  })

  // 4. Lịch sử lệnh: 100% bắt đầu sạch sẽ từ các setup thực tế phát sinh trong phiên
  // Tuyệt đối không nạp lệnh giả định hay số tiền ảo!
  const [userClosedTrades, setUserClosedTrades] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USER_TRADES_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Danh sách lịch sử chỉ ghi nhận các lệnh thực tế của hệ thống
  const tradeHistory = userClosedTrades

  // Hàm Reset toàn bộ dữ liệu sạch sẽ về 0
  const resetAllData = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_SETUPS_KEY)
      localStorage.removeItem(STORAGE_USER_TRADES_KEY)
      localStorage.removeItem('northstar_active_setups_disciplined_v4')
      localStorage.removeItem('northstar_user_closed_trades_v4')
      localStorage.removeItem('northstar_active_setups_clean_v5')
      localStorage.removeItem('northstar_user_trades_clean_v5')
    } catch {}
    setSetups(EMPTY_SETUPS)
    setUserClosedTrades([])
  }, [])

  // Lưu setups vào localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETUPS_KEY, JSON.stringify(setups))
    } catch (e) {
      console.warn('Lỗi lưu setups:', e)
    }
  }, [setups])

  // Lưu userClosedTrades vào localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_USER_TRADES_KEY, JSON.stringify(userClosedTrades))
    } catch (e) {
      console.warn('Lỗi lưu user closed trades:', e)
    }
  }, [userClosedTrades])

  // Chuẩn hóa symbol
  const normalizeSymbol = useCallback((rawSymbol) => {
    if (!rawSymbol) return 'BTCUSDT'
    const s = String(rawSymbol).toUpperCase().replace('/', '').replace(' ', '')
    if (s.includes('XAU') || s.includes('GOLD')) return 'XAUUSDT'
    return 'BTCUSDT'
  }, [])

  // Lấy setup hiện tại của 1 mã
  const getSetupForSymbol = useCallback((rawSymbol) => {
    const sym = normalizeSymbol(rawSymbol)
    return setups[sym] || null
  }, [setups, normalizeSymbol])

  // Hành động 1: Người dùng bấm "Đồng ý" -> Bắt đầu follow setup
  const approveSetup = useCallback((rawSymbol) => {
    const sym = normalizeSymbol(rawSymbol)
    setSetups((prev) => {
      const target = prev[sym]
      if (!target) return prev
      return {
        ...prev,
        [sym]: {
          ...target,
          status: 'FOLLOWING',
          approvedAt: Date.now(),
          note: 'Đang theo dõi live trên biểu đồ. Hệ thống bảo vệ theo TP/SL đã định sẵn.'
        }
      }
    })
  }, [normalizeSymbol])

  // Hành động 2: Người dùng từ chối / hủy thủ công
  const rejectSetup = useCallback((rawSymbol, reason = 'Người dùng từ chối setup') => {
    const sym = normalizeSymbol(rawSymbol)
    setSetups((prev) => {
      const target = prev[sym]
      if (!target) return prev

      const cancelledTrade = {
        id: `user-cancel-${Date.now()}`,
        symbol: target.symbol,
        pair: target.pair || `${target.symbol.slice(0, 3)}/USDT`,
        direction: target.direction,
        entry_price: target.entry_price,
        exit_price: target.entry_price,
        stop_loss: target.stop_loss,
        take_profit: target.take_profit,
        deltaPoints: 0,
        deltaPct: 0,
        realizedR: 0,
        result: 'CANCELLED',
        exitReason: reason,
        closedAt: Date.now(),
        durationMinutes: Math.max(1, Math.round((Date.now() - target.createdAt) / 60000))
      }

      setUserClosedTrades((hist) => [cancelledTrade, ...hist])

      return {
        ...prev,
        [sym]: null
      }
    })
  }, [normalizeSymbol])

  // Hành động 3: Đề xuất setup đạt chuẩn vào bộ nhớ
  const proposeSetup = useCallback((newSetup) => {
    if (!newSetup || !newSetup.symbol) return { success: false, reason: 'Setup không hợp lệ' }
    const sym = normalizeSymbol(newSetup.symbol)

    let blocked = false
    setSetups((prev) => {
      const current = prev[sym]
      if (current && (current.status === 'PENDING_APPROVAL' || current.status === 'FOLLOWING')) {
        blocked = true
        return prev
      }

      const formatted = {
        id: newSetup.id || `setup-${sym.toLowerCase()}-${Date.now()}`,
        symbol: sym,
        pair: sym === 'XAUUSDT' ? 'XAU/USDT' : 'BTC/USDT',
        direction: (newSetup.direction || newSetup.type || 'BUY').toUpperCase().includes('BUY') ? 'BUY' : 'SELL',
        type: (newSetup.direction || newSetup.type || 'BUY').toUpperCase().includes('BUY') ? 'LONG' : 'SHORT',
        entry_price: Number(newSetup.entry_price || newSetup.price || 0),
        take_profit: Number(newSetup.take_profit || newSetup.target || 0),
        stop_loss: Number(newSetup.stop_loss || newSetup.stop || 0),
        delta_sl: Number(newSetup.delta_sl || Math.abs(newSetup.entry_price - newSetup.stop_loss) || 0),
        delta_tp: Number(newSetup.delta_tp || Math.abs(newSetup.take_profit - newSetup.entry_price) || 0),
        rr_ratio: Number(newSetup.rr_ratio || 1.5),
        confidence: Number(newSetup.confidence || 85.0),
        status: 'PENDING_APPROVAL', // Chờ bạn duyệt
        createdAt: Date.now(),
        expiryMinutes: 15,
        analysis: newSetup.analysis || `Mẫu hình thắng đạt chuẩn Cosine Similarity (${newSetup.confidence || 85}%).`,
        note: 'Đang chờ bạn duyệt. Bấm Đồng ý để bắt đầu follow.'
      }

      return {
        ...prev,
        [sym]: formatted
      }
    })

    if (blocked) {
      return {
        success: false,
        reason: `Mã ${sym} hiện đã có 1 setup đang live. Kỷ luật hệ thống: 1 thời điểm chỉ có 1 setup duy nhất trên mỗi mã.`
      }
    }
    return { success: true }
  }, [normalizeSymbol])

  // =========================================================================
  // HÀNH ĐỘNG 4: QUÉT THỊ TRƯỜNG THỰC TẾ — TUÂN THỦ 100% TIÊU CHUẨN KHẮT KHE
  // Tuyệt đối không ép ra lệnh nếu nến chưa đạt chuẩn!
  // =========================================================================
  const scanRealMarketSetup = useCallback(async (rawSymbol) => {
    const sym = normalizeSymbol(rawSymbol)

    // Nếu đã có setup, không tạo thêm để tránh tự mâu thuẫn
    if (setups[sym] && (setups[sym].status === 'PENDING_APPROVAL' || setups[sym].status === 'FOLLOWING')) {
      const msg = `Mã ${sym} đã có 1 setup đang hoạt động. Kỷ luật hệ thống: không sinh lệnh mới đối lập.`
      setLastScanResult({
        symbol: sym,
        timestamp: Date.now(),
        currentPrice: setups[sym].entry_price,
        status: 'REJECTED',
        reason: 'ALREADY_HAS_ACTIVE_SETUP',
        message: msg
      })
      return { success: false, reason: msg }
    }

    try {
      // Gọi API so khớp FAISS Vector 49D & Volume Regime thật từ Backend
      const scanRes = await scanLatestSignal(sym)
      const currentPrice = scanRes?.entry_price || 0

      // KIỂM DUYỆT ĐIỀU KIỆN CHẤT LƯỢNG CAO (APPROVED):
      // Phải vượt qua Volume Filter (P20 - P85), Cosine Similarity >= 85%, Đồng thuận >= 80%, R:R >= 1.5
      if (scanRes && scanRes.status === 'APPROVED' && scanRes.direction && scanRes.direction !== 'NONE' && currentPrice > 0) {
        proposeSetup(scanRes)
        const successMsg = `MẪU HÌNH ĐẠT CHUẨN! ${scanRes.direction} @ $${currentPrice.toLocaleString()}. Độ tin cậy: ${scanRes.confidence}%. Tỷ lệ R:R >= 1.5.`
        setLastScanResult({
          symbol: sym,
          timestamp: Date.now(),
          currentPrice,
          status: 'APPROVED',
          reason: 'PASSED_ALL_FILTERS',
          message: successMsg
        })
        return { success: true, approved: true, signal: scanRes, message: successMsg }
      }

      // KHI KHÔNG ĐẠT CHUẨN: TUYỆT ĐỐI KHÔNG ÉP RA LỆNH BỪA BÃI!
      // Giữ vững kỷ luật kiên nhẫn quan sát để bảo vệ vốn của trader
      const rejectReason = scanRes?.reject_reason || 'NO_CLEAR_SIGNAL'
      let readableReason = 'Mẫu hình nến hiện tại chưa đạt ngưỡng 85% tương đồng với các mẫu hình thắng trong quá khứ.'
      if (rejectReason.includes('VOLUME_FILTER')) {
        readableReason = 'Khối lượng nến nằm ngoài phân vị an toàn (P20 - P85), tiềm ẩn rủi ro bão tin hoặc thanh khoản mỏng.'
      } else if (rejectReason.includes('SL_TOO_TIGHT') || rejectReason.includes('SL_TOO_WIDE')) {
        readableReason = 'Biên độ Stop Loss không tối ưu tỷ lệ Reward/Risk.'
      }

      const noTradeMsg = `Nến M5 hiện tại (Giá: $${currentPrice > 0 ? currentPrice.toLocaleString() : '...' }): ${readableReason} KHÔNG VÀO LỆNH để bảo vệ tài khoản.`
      setLastScanResult({
        symbol: sym,
        timestamp: Date.now(),
        currentPrice,
        status: 'REJECTED',
        reason: rejectReason,
        message: noTradeMsg
      })

      return {
        success: false,
        approved: false,
        currentPrice,
        reason: rejectReason,
        message: noTradeMsg
      }
    } catch (err) {
      const errMsg = `Lỗi kết nối khi quét thị trường: ${err.message}`
      setLastScanResult({
        symbol: sym,
        timestamp: Date.now(),
        currentPrice: 0,
        status: 'REJECTED',
        reason: 'NETWORK_ERROR',
        message: errMsg
      })
      return { success: false, reason: errMsg }
    }
  }, [normalizeSymbol, setups, proposeSetup])

  // =========================================================================
  // HÀNH ĐỘNG 5: NẠP SETUP ĐẠT CHUẨN GẦN NHẤT TỪ BỘ NHỚ LỊCH SỬ THẬT
  // Dành cho khi người dùng muốn soi chiếu mẫu hình thắng mà AI từng duyệt thật
  // =========================================================================
  const loadLatestApprovedSignalFromMemory = useCallback(async (rawSymbol) => {
    const sym = normalizeSymbol(rawSymbol)
    try {
      const historyRes = await fetchSignalsHistory()
      if (historyRes && historyRes.signals && historyRes.signals.length > 0) {
        // Tìm tín hiệu APPROVED đầu tiên của symbol này
        const matched = historyRes.signals.find(
          (s) => (s.symbol === sym || s.pair?.replace('/', '') === sym) && s.status === 'APPROVED' && s.direction !== 'NONE'
        ) || historyRes.signals.find((s) => s.status === 'APPROVED' && s.direction !== 'NONE')

        if (matched) {
          proposeSetup({
            ...matched,
            symbol: sym,
            analysis: matched.analysis || `Mẫu hình thắng được duyệt thật từ Memory Bank (${matched.confidence || 88.5}% đồng thuận).`
          })
          return { success: true, signal: matched }
        }
      }
      return { success: false, reason: 'Chưa có mẫu hình approved nào trong lịch sử gần đây.' }
    } catch (err) {
      return { success: false, reason: err.message }
    }
  }, [normalizeSymbol, proposeSetup])

  // Hành động 6: Kiểm tra giá Live & Tự động Hủy / Chốt lời / Cắt lỗ
  const evaluatePriceUpdate = useCallback((rawSymbol, currentPrice) => {
    if (!currentPrice || currentPrice <= 0) return
    const sym = normalizeSymbol(rawSymbol)

    setSetups((prev) => {
      const setup = prev[sym]
      if (!setup) return prev

      // Bảo vệ: nếu entry_price = 0 hoặc delta_tp/sl không hợp lệ, bỏ qua evaluate
      if (!setup.entry_price || setup.entry_price <= 0) return prev
      const delta_tp = Number(setup.delta_tp) || 0
      const delta_sl = Number(setup.delta_sl) || 0
      // Nếu chưa có giá TP/SL cụ thể, không thể evaluate — bỏ qua
      if (delta_tp <= 0 && (!setup.take_profit || setup.take_profit <= 0)) return prev

      const now = Date.now()
      const ageMinutes = (now - setup.createdAt) / 60000
      const isBuy = setup.direction === 'BUY'

      // Trạng thái 1: PENDING_APPROVAL
      if (setup.status === 'PENDING_APPROVAL') {
        // Hủy do đi ngang quá lâu (> 15 phút chưa duyệt)
        if (ageMinutes > (setup.expiryMinutes || 15)) {
          const cancelRecord = {
            id: `cancel-${Date.now()}`,
            symbol: setup.symbol,
            pair: setup.pair,
            direction: setup.direction,
            entry_price: setup.entry_price,
            exit_price: currentPrice,
            stop_loss: setup.stop_loss,
            take_profit: setup.take_profit,
            deltaPoints: 0,
            deltaPct: 0,
            realizedR: 0,
            result: 'CANCELLED',
            exitReason: 'HỦY TỰ ĐỘNG: Giá đi ngang quá 15 phút, bối cảnh nến không còn đúng ban đầu',
            closedAt: now,
            durationMinutes: Math.round(ageMinutes)
          }
          setUserClosedTrades((hist) => [cancelRecord, ...hist])
          return { ...prev, [sym]: null }
        }

        // Hủy do Missed Entry (Giá đã đi qua vùng vào lệnh)
        // CHỈ kiểm tra khi có đủ dữ liệu TP/SL hợp lệ (> 0)
        const hasTp = setup.take_profit && setup.take_profit > 0
        const hasSl = setup.stop_loss && setup.stop_loss > 0
        const hasEntry = setup.entry_price && setup.entry_price > 0

        if (hasTp && hasSl && hasEntry) {
          if (isBuy) {
            // BUY: hủy nếu giá đã vượt quá TP hoặc xuyên dưới SL
            if (currentPrice >= setup.take_profit || currentPrice <= setup.stop_loss) {
              const cancelRecord = {
                id: `cancel-${Date.now()}`,
                symbol: setup.symbol,
                pair: setup.pair,
                direction: setup.direction,
                entry_price: setup.entry_price,
                exit_price: currentPrice,
                stop_loss: setup.stop_loss,
                take_profit: setup.take_profit,
                deltaPoints: 0,
                deltaPct: 0,
                realizedR: 0,
                result: 'CANCELLED',
                exitReason: 'HỦY TỰ ĐỘNG: Giá đã đi qua vùng vào lệnh (Missed Entry Zone)',
                closedAt: now,
                durationMinutes: Math.round(ageMinutes)
              }
              setUserClosedTrades((hist) => [cancelRecord, ...hist])
              return { ...prev, [sym]: null }
            }
          } else {
            // SELL: hủy nếu giá đã xuyên xuống dưới TP hoặc vượt lên trên SL
            if (currentPrice <= setup.take_profit || currentPrice >= setup.stop_loss) {
              const cancelRecord = {
                id: `cancel-${Date.now()}`,
                symbol: setup.symbol,
                pair: setup.pair,
                direction: setup.direction,
                entry_price: setup.entry_price,
                exit_price: currentPrice,
                stop_loss: setup.stop_loss,
                take_profit: setup.take_profit,
                deltaPoints: 0,
                deltaPct: 0,
                realizedR: 0,
                result: 'CANCELLED',
                exitReason: 'HỦY TỰ ĐỘNG: Giá đã đi qua vùng vào lệnh (Missed Entry Zone)',
                closedAt: now,
                durationMinutes: Math.round(ageMinutes)
              }
              setUserClosedTrades((hist) => [cancelRecord, ...hist])
              return { ...prev, [sym]: null }
            }
          }
        }
      }

      // Trạng thái 2: FOLLOWING
      if (setup.status === 'FOLLOWING') {
        const hitTp = isBuy ? (currentPrice >= setup.take_profit) : (currentPrice <= setup.take_profit)
        if (hitTp) {
          const deltaPts = Math.abs(setup.take_profit - setup.entry_price)
          const deltaPct = ((deltaPts / setup.entry_price) * 100)
          const realizedR = Number(setup.rr_ratio) || 1.5
          const winRecord = {
            id: `win-${Date.now()}`,
            symbol: setup.symbol,
            pair: setup.pair,
            direction: setup.direction,
            entry_price: setup.entry_price,
            exit_price: setup.take_profit,
            stop_loss: setup.stop_loss,
            take_profit: setup.take_profit,
            deltaPoints: Math.round(deltaPts * 100) / 100,
            deltaPct: Math.round(deltaPct * 100) / 100,
            realizedR: Math.round(realizedR * 10) / 10,
            result: 'WIN',
            exitReason: 'ĐẠT MỤC TIÊU TAKE PROFIT (TP HIT)',
            closedAt: now,
            durationMinutes: Math.round(ageMinutes)
          }
          setUserClosedTrades((hist) => [winRecord, ...hist])
          return { ...prev, [sym]: null }
        }

        const hitSl = isBuy ? (currentPrice <= setup.stop_loss) : (currentPrice >= setup.stop_loss)
        if (hitSl) {
          const deltaPts = -Math.abs(setup.stop_loss - setup.entry_price)
          const deltaPct = -((Math.abs(setup.stop_loss - setup.entry_price) / setup.entry_price) * 100)
          const lossRecord = {
            id: `loss-${Date.now()}`,
            symbol: setup.symbol,
            pair: setup.pair,
            direction: setup.direction,
            entry_price: setup.entry_price,
            exit_price: setup.stop_loss,
            stop_loss: setup.stop_loss,
            take_profit: setup.take_profit,
            deltaPoints: Math.round(deltaPts * 100) / 100,
            deltaPct: Math.round(deltaPct * 100) / 100,
            realizedR: -1.0,
            result: 'LOSS',
            exitReason: 'CHẠM NGƯỠNG CẮT LỖ (SL HIT)',
            closedAt: now,
            durationMinutes: Math.round(ageMinutes)
          }
          setUserClosedTrades((hist) => [lossRecord, ...hist])
          return { ...prev, [sym]: null }
        }

        if (ageMinutes > 45) {
          const cancelRecord = {
            id: `cancel-${Date.now()}`,
            symbol: setup.symbol,
            pair: setup.pair,
            direction: setup.direction,
            entry_price: setup.entry_price,
            exit_price: currentPrice,
            stop_loss: setup.stop_loss,
            take_profit: setup.take_profit,
            deltaPoints: 0,
            deltaPct: 0,
            realizedR: 0,
            result: 'CANCELLED',
            exitReason: 'HỦY TỰ ĐỘNG: Giá đi ngang quá 45 phút, hủy vị thế an toàn',
            closedAt: now,
            durationMinutes: Math.round(ageMinutes)
          }
          setUserClosedTrades((hist) => [cancelRecord, ...hist])
          return { ...prev, [sym]: null }
        }
      }

      return prev
    })
  }, [normalizeSymbol])

  // =========================================================================
  // HỆ THỐNG RADAR TỰ ĐỘNG: LẮNG NGHE WEBSOCKET & TỰ ĐỘNG THEO DÕI NẾN M5
  // =========================================================================
  useEffect(() => {
    let ws = null
    let reconnectTimeout = null

    function connectWs() {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const host = window.location.hostname || 'localhost'
        ws = new WebSocket(`${protocol}//${host}:8000/ws/live`)

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (data.type === 'NEW_APPROVED_SETUP' && data.signal) {
              const sig = data.signal
              const sym = normalizeSymbol(sig.symbol)

              setSetups((curr) => {
                if (curr[sym] && (curr[sym].status === 'PENDING_APPROVAL' || curr[sym].status === 'FOLLOWING')) {
                  return curr
                }

                playAlertChime()
                setRadarState((r) => ({
                  ...r,
                  alertBanner: {
                    message: `Radar tự động phát hiện mẫu hình A+ ${sig.direction} (${sym === 'XAUUSDT' ? 'XAU/USDT' : 'BTC/USDT'}) tại $${Number(sig.entry_price).toLocaleString()}!`,
                    signal: sig
                  }
                }))

                return {
                  ...curr,
                  [sym]: {
                    id: sig.id || `setup-${sym.toLowerCase()}-${Date.now()}`,
                    symbol: sym,
                    pair: sym === 'XAUUSDT' ? 'XAU/USDT' : 'BTC/USDT',
                    direction: (sig.direction || 'BUY').toUpperCase().includes('BUY') ? 'BUY' : 'SELL',
                    type: (sig.direction || 'BUY').toUpperCase().includes('BUY') ? 'LONG' : 'SHORT',
                    entry_price: Number(sig.entry_price || 0),
                    take_profit: Number(sig.take_profit || 0),
                    stop_loss: Number(sig.stop_loss || 0),
                    delta_sl: Number(sig.delta_sl || Math.abs(sig.entry_price - sig.stop_loss) || 0),
                    delta_tp: Number(sig.delta_tp || Math.abs(sig.take_profit - sig.entry_price) || 0),
                    rr_ratio: Number(sig.rr_ratio || 1.5),
                    confidence: Number(sig.confidence || 85.0),
                    status: 'PENDING_APPROVAL',
                    createdAt: Date.now(),
                    expiryMinutes: 15,
                    analysis: `Mẫu hình thắng được tự động bắt từ Radar M5 (${sig.confidence || 85}% tương đồng).`,
                    note: 'Đang chờ bạn duyệt. Bấm Đồng ý để bắt đầu follow.'
                  }
                }
              })
            }
          } catch {
            // bỏ qua parse error
          }
        }

        ws.onerror = () => {
          try { ws.close() } catch {}
        }

        ws.onclose = () => {
          reconnectTimeout = setTimeout(connectWs, 5000)
        }
      } catch {
        reconnectTimeout = setTimeout(connectWs, 5000)
      }
    }

    connectWs()

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      if (ws) {
        try { ws.close() } catch {}
      }
    }
  }, [normalizeSymbol])

  // VÒNG LẶP LIÊN TỤC: Cập nhật biến động giá thật từ Binance để thẩm định Setup
  useEffect(() => {
    let tickCount = 0
    const interval = setInterval(async () => {
      tickCount++
      const sym = tickCount % 2 === 0 ? 'BTCUSDT' : 'XAUUSDT'

      setRadarState((r) => ({
        ...r,
        scanCount: r.scanCount + 1,
        lastSymbolScanned: sym === 'BTCUSDT' ? 'BTC/USDT' : 'XAU/USDT'
      }))

      try {
        // Dùng limit=15 thay vì 2 (backend yêu cầu ge=10)
        const klinesRes = await fetchKlines(sym, 15)
        if (klinesRes?.data && klinesRes.data.length > 0) {
          const lastBar = klinesRes.data[klinesRes.data.length - 1]
          const curPrice = Number(lastBar.close || lastBar[4] || 0)
          if (curPrice > 0) {
            evaluatePriceUpdate(sym, curPrice)
          }
        }
      } catch {
        // bỏ qua lỗi mạng tạm thời
      }
    }, 8000) // 8 giây/lần để giảm tải, không cần quá dày

    return () => clearInterval(interval)
  }, [evaluatePriceUpdate])

  // Tính toán thống kê hiệu suất Win Rate & R:R (Chuẩn Bot Tín Hiệu, Không Mock Tiền)
  const stats = useMemo(() => {
    const validTrades = tradeHistory.filter((t) => t.result === 'WIN' || t.result === 'LOSS')
    const totalTrades = validTrades.length
    const winTrades = tradeHistory.filter((t) => t.result === 'WIN').length
    const lossTrades = tradeHistory.filter((t) => t.result === 'LOSS').length
    const cancelledTrades = tradeHistory.filter((t) => t.result === 'CANCELLED').length
    const winRate = totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0

    let totalR = 0
    let netPoints = 0
    tradeHistory.forEach((t) => {
      if (t.realizedR !== undefined && t.realizedR !== null) {
        totalR += Number(t.realizedR) || 0
      }
      if (t.deltaPoints !== undefined && t.deltaPoints !== null) {
        netPoints += Number(t.deltaPoints) || 0
      }
    })

    return {
      totalAllRecords: tradeHistory.length,
      totalTrades,
      winTrades,
      lossTrades,
      cancelledTrades,
      winRate: Math.round(winRate * 10) / 10,
      totalR: Math.round(totalR * 10) / 10,
      netPoints: Math.round(netPoints * 100) / 100
    }
  }, [tradeHistory])

  const activeCount = useMemo(() => {
    let count = 0
    if (setups.BTCUSDT) count++
    if (setups.XAUUSDT) count++
    return count
  }, [setups])

  const value = {
    setups,
    tradeHistory,
    stats,
    activeCount,
    lastScanResult,
    radarState,
    dismissRadarAlert,
    getSetupForSymbol,
    approveSetup,
    rejectSetup,
    proposeSetup,
    scanRealMarketSetup,
    loadLatestApprovedSignalFromMemory,
    evaluatePriceUpdate,
    normalizeSymbol,
    resetAllData
  }

  return (
    <TradeSetupContext.Provider value={value}>
      {children}
    </TradeSetupContext.Provider>
  )
}

export function useTradeManager() {
  const context = useContext(TradeSetupContext)
  if (!context) {
    throw new Error('useTradeManager must be used within a TradeSetupProvider')
  }
  return context
}
