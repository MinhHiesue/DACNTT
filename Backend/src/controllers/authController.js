import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'

function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
  }
}

function createToken(user) {
  return jwt.sign(
    { sub: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: '1d' },
  )
}

export async function register(req, res) {
  const { name, email, password } = req.body ?? {}

  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({
      success: false,
      message: 'Mật khẩu phải có ít nhất 8 ký tự và không vượt quá 72 byte UTF-8.',
    })
  }

  const user = await User.create({ name, email, passwordHash: password })

  return res.status(201).json({
    success: true,
    message: 'Đăng ký tài khoản thành công.',
    data: {
      token: createToken(user),
      user: toPublicUser(user),
    },
  })
}

export async function login(req, res) {
  const { email, password } = req.body ?? {}

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng nhập email và mật khẩu.',
    })
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash')
  const passwordMatches = user && await user.comparePassword(password)

  if (!passwordMatches) {
    return res.status(401).json({
      success: false,
      message: 'Email hoặc mật khẩu không chính xác.',
    })
  }

  return res.json({
    success: true,
    message: 'Đăng nhập thành công.',
    data: {
      token: createToken(user),
      user: toPublicUser(user),
    },
  })
}

export function getCurrentUser(req, res) {
  return res.json({
    success: true,
    data: {
      user: toPublicUser(req.user),
    },
  })
}
