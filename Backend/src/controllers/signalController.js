import mongoose from 'mongoose'
import { Signal } from '../models/Signal.js'

export async function getSignals(req, res) {
  const signals = await Signal.find().sort({ createdAt: -1 }).lean()

  res.json({
    success: true,
    count: signals.length,
    data: signals,
  })
}

export async function getSignalById(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'ID tín hiệu không hợp lệ.',
    })
  }

  const signal = await Signal.findById(req.params.id).lean()

  if (!signal) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy tín hiệu.',
    })
  }

  return res.json({
    success: true,
    data: signal,
  })
}

export async function createSignal(req, res) {
  const {
    symbol,
    type,
    price,
    confidence,
    status,
    analysis,
    createdAt,
  } = req.body ?? {}

  const signal = await Signal.create({
    symbol,
    type,
    price,
    confidence,
    status,
    analysis,
    ...(createdAt !== undefined ? { createdAt } : {}),
  })

  return res.status(201).json({
    success: true,
    message: 'Tạo tín hiệu thành công.',
    data: signal,
  })
}
