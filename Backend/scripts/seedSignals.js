import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDatabase } from '../src/config/database.js'
import { Signal } from '../src/models/Signal.js'

const samples = [
  {
    symbol: 'XAU/USDT',
    type: 'BUY',
    price: 4026.5,
    confidence: 92,
    status: 'ACTIVE',
    analysis: 'FAISS so khớp 18 mẫu hình thắng trong Memory Bank (đồng thuận 92.4%). XGBoost xác nhận đà tăng (89.5%). Swing Low tại 4,018.50.',
    createdAt: new Date('2026-10-24T06:00:00.000Z'),
  },
  {
    symbol: 'XAU/USDT',
    type: 'SELL',
    price: 4035.8,
    confidence: 89,
    status: 'ACTIVE',
    analysis: 'Đảo chiều Bearish Engulfing tại kháng cự P85. FAISS đồng thuận 89.2%, XGBoost xác nhận 86.4%.',
    createdAt: new Date('2026-10-24T05:25:00.000Z'),
  },
  {
    symbol: 'BTC/USDT',
    type: 'BUY',
    price: 67250.5,
    confidence: 88,
    status: 'NEW',
    analysis: 'Giá giữ trên MA20, RSI(7) vượt 58 kèm Z-Score Volume +1.8; cấu trúc nến tăng tiếp diễn.',
    createdAt: new Date('2026-10-24T04:45:00.000Z'),
  },
  {
    symbol: 'XAU/USDT',
    type: 'BUY',
    price: 4012.2,
    confidence: 87,
    status: 'NEW',
    analysis: 'Cấu trúc tạo đáy đôi (Double Bottom) trên khung M5. Tỷ lệ R:R đạt chuẩn 1.50.',
    createdAt: new Date('2026-10-24T04:10:00.000Z'),
  },
  {
    symbol: 'ETH/USDT',
    type: 'HOLD',
    price: 3520.75,
    confidence: 68,
    status: 'NEW',
    analysis: 'MACD chưa xác nhận xu hướng; biên độ giao dịch hẹp quanh EMA50.',
    createdAt: new Date('2026-10-24T03:30:00.000Z'),
  },
  {
    symbol: 'BNB/USDT',
    type: 'SELL',
    price: 598.2,
    confidence: 78,
    status: 'ACTIVE',
    analysis: 'Động lượng ngắn hạn suy yếu; nến Shooting Star tại đỉnh phiên.',
    createdAt: new Date('2026-10-24T02:50:00.000Z'),
  },
  {
    symbol: 'XAU/USDT',
    type: 'BUY',
    price: 4020.0,
    confidence: 93,
    status: 'ACTIVE',
    analysis: 'Đồng thuận kỷ lục: 19 mẫu hình thắng trong cơ sở dữ liệu với độ tương đồng 93.0%.',
    createdAt: new Date('2026-10-24T02:15:00.000Z'),
  },
  {
    symbol: 'SOL/USDT',
    type: 'BUY',
    price: 182.4,
    confidence: 85,
    status: 'NEW',
    analysis: 'Bứt phá khỏi mô hình cái nêm giảm (Falling Wedge); khối lượng nổ tăng 140%.',
    createdAt: new Date('2026-10-24T01:30:00.000Z'),
  },
  {
    symbol: 'XAU/USDT',
    type: 'SELL',
    price: 4048.0,
    confidence: 91,
    status: 'ACTIVE',
    analysis: 'So khớp 17 mẫu hình đỉnh nhọn tại vùng quá mua RSI. R:R 1.50 với Delta SL = $8.00.',
    createdAt: new Date('2026-10-24T00:50:00.000Z'),
  },
]

try {
  await connectDatabase()
  const operations = samples.map((sample) => ({
    updateOne: {
      filter: { symbol: sample.symbol, analysis: sample.analysis },
      update: { $setOnInsert: sample },
      upsert: true,
    },
  }))

  const result = await Signal.bulkWrite(operations)
  console.log(`Đã thêm ${result.upsertedCount} tín hiệu mẫu mới.`)
} catch (error) {
  console.error('Không thể tạo dữ liệu mẫu:', error.message)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
