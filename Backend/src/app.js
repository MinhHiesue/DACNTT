import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import authRoutes from './routes/authRoutes.js'
import signalRoutes from './routes/signalRoutes.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

const app = express()

const allowedOrigins = new Set([
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://127.0.0.1:5173',
])

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true)
    }

    return callback(new Error('Origin không được phép truy cập API.'))
  },
}))
app.use(express.json({ limit: '20kb' }))

app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1

  return res.status(connected ? 200 : 503).json({
    success: connected,
    status: connected ? 'ok' : 'unavailable',
    database: connected ? 'connected' : 'disconnected',
  })
})

app.use('/api/signals', signalRoutes)
app.use('/api/auth', authRoutes)
app.use(notFoundHandler)
app.use(errorHandler)

export default app
