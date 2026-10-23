import mongoose from 'mongoose'

const signalSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: [true, 'symbol là bắt buộc'],
    trim: true,
    uppercase: true,
    minlength: [2, 'symbol phải có ít nhất 2 ký tự'],
    maxlength: [30, 'symbol không được vượt quá 30 ký tự'],
    match: [/^[A-Z0-9][A-Z0-9._/-]*$/, 'symbol chứa ký tự không hợp lệ'],
  },
  type: {
    type: String,
    required: [true, 'type là bắt buộc'],
    enum: {
      values: ['BUY', 'SELL', 'HOLD'],
      message: 'type chỉ được là BUY, SELL hoặc HOLD',
    },
    uppercase: true,
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'price là bắt buộc'],
    min: [Number.MIN_VALUE, 'price phải lớn hơn 0'],
    validate: {
      validator: Number.isFinite,
      message: 'price phải là số hữu hạn',
    },
  },
  confidence: {
    type: Number,
    required: [true, 'confidence là bắt buộc'],
    min: [0, 'confidence phải từ 0 đến 100'],
    max: [100, 'confidence phải từ 0 đến 100'],
    validate: {
      validator: Number.isFinite,
      message: 'confidence phải là số hữu hạn',
    },
  },
  status: {
    type: String,
    required: [true, 'status là bắt buộc'],
    default: 'NEW',
    trim: true,
    uppercase: true,
    maxlength: [50, 'status không được vượt quá 50 ký tự'],
  },
  analysis: {
    type: String,
    required: [true, 'analysis là bắt buộc'],
    trim: true,
    minlength: [1, 'analysis không được để trống'],
    maxlength: [2000, 'analysis không được vượt quá 2000 ký tự'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export const Signal = mongoose.model('Signal', signalSchema)
