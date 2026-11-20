import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDatabase } from '../src/config/database.js'
import { User } from '../src/models/User.js'

const email = process.argv[2]?.trim().toLowerCase()

try {
  if (!email) {
    throw new Error('Dùng lệnh: npm run admin:promote -- email@example.com')
  }

  await connectDatabase()
  const user = await User.findOne({ email })
  if (!user) {
    throw new Error(`Không tìm thấy tài khoản ${email}. Hãy đăng ký tài khoản trước.`)
  }
  if (user.isActive === false) {
    throw new Error('Không thể cấp quyền admin cho tài khoản đang bị khóa.')
  }

  user.role = 'admin'
  await user.save()
  console.log(`Đã cấp quyền admin cho ${user.email}.`)
} catch (error) {
  console.error('Không thể cấp quyền admin:', error.message)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
