import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'name là bắt buộc'],
    trim: true,
    minlength: [2, 'Tên phải có ít nhất 2 ký tự'],
    maxlength: [80, 'Tên không được vượt quá 80 ký tự'],
  },
  email: {
    type: String,
    required: [true, 'email là bắt buộc'],
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: [254, 'Email không hợp lệ'],
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email không hợp lệ'],
  },
  passwordHash: {
    type: String,
    required: true,
    select: false,
  },
  // Các trường phục vụ liên kết Telegram
  telegramChatId: {
    type: String,
    default: null,
  },
  telegramIsActive: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true,
})

userSchema.pre('save', async function hashPassword() {
  if (this.isModified('passwordHash')) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12)
  }
})

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash)
}

export const User = mongoose.model('User', userSchema)