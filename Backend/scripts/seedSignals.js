import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDatabase } from '../src/config/database.js'
import { Signal } from '../src/models/Signal.js'

const samples = [
  {
    symbol: 'BTC/USDT',
    type: 'BUY',
    price: 67250.5,
    confidence: 87,
    status: 'NEW',
    analysis: 'Giá giữ trên MA20, RSI tăng ổn định; dữ liệu mẫu để kiểm thử API.',
    createdAt: new Date('2026-10-23T08:00:00.000Z'),
  },
  {
    symbol: 'ETH/USDT',
    type: 'HOLD',
    price: 3520.75,
    confidence: 68,
    status: 'NEW',
    analysis: 'MACD chưa xác nhận xu hướng; dữ liệu mẫu để kiểm thử API.',
    createdAt: new Date('2026-10-23T07:00:00.000Z'),
  },
  {
    symbol: 'BNB/USDT',
    type: 'SELL',
    price: 598.2,
    confidence: 76,
    status: 'ACTIVE',
    analysis: 'Động lượng ngắn hạn suy yếu; dữ liệu mẫu để kiểm thử API.',
    createdAt: new Date('2026-10-23T06:00:00.000Z'),
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
