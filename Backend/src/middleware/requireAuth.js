import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'

export async function requireAuth(req, res, next) {
  const authorization = req.get('authorization')
  const [scheme, token] = authorization?.split(' ') ?? []

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      success: false,
      message: 'Vui lòng đăng nhập để tiếp tục.',
    })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.sub).lean()

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản không còn tồn tại.',
      })
    }

    if (user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản đã bị khóa.',
      })
    }

    req.user = {
      ...user,
      role: user.role ?? 'user',
      isActive: user.isActive !== false,
    }
    return next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
      })
    }

    return next(error)
  }
}
