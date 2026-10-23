import 'dotenv/config'
import app from './app.js'
import { connectDatabase } from './config/database.js'

const port = Number(process.env.PORT) || 5000

try {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.startsWith('replace-with-')) {
    throw new Error('Hãy cấu hình JWT_SECRET ngẫu nhiên dài ít nhất 32 ký tự trong file .env')
  }

  await connectDatabase()
  app.listen(port, () => {
    console.log(`Backend đang chạy tại http://localhost:${port}`)
  })
} catch (error) {
  console.error('Không thể khởi động backend:', error.message)
  process.exitCode = 1
}
