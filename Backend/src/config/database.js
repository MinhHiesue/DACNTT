import mongoose from 'mongoose'

export async function connectDatabase() {
  const { MONGODB_URI } = process.env

  if (!MONGODB_URI) {
    throw new Error('Thiếu biến môi trường MONGODB_URI trong file .env')
  }

  await mongoose.connect(MONGODB_URI)
  console.log('Đã kết nối MongoDB.')
}
