import mongoose from 'mongoose'
import { User } from '../models/User.js'

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function activeAdminFilter() {
  return { role: 'admin', isActive: { $ne: false } }
}

function validUserId(id) {
  return mongoose.isValidObjectId(id)
}

function isCurrentAdmin(req, userId) {
  return String(req.user._id).toLowerCase() === userId.toLowerCase()
}

export async function listUsers(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 20))
  const conditions = []
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : ''
  const role = req.query.role
  const status = req.query.status

  if ((role && role !== 'user' && role !== 'admin') ||
    (status && status !== 'active' && status !== 'locked')) {
    return res.status(400).json({ success: false, message: 'Bộ lọc tài khoản không hợp lệ.' })
  }

  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i')
    conditions.push({ $or: [{ name: pattern }, { email: pattern }] })
  }

  if (role === 'admin') conditions.push({ role: 'admin' })
  if (role === 'user') conditions.push({ $or: [{ role: 'user' }, { role: { $exists: false } }] })
  if (status === 'active') conditions.push({ isActive: { $ne: false } })
  if (status === 'locked') conditions.push({ isActive: false })

  const filter = conditions.length ? { $and: conditions } : {}
  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .select('name email role isActive createdAt')
      .sort({ createdAt: -1, _id: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
  ])

  return res.json({
    success: true,
    data: {
      users: users.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role ?? 'user',
        isActive: user.isActive !== false,
        createdAt: user.createdAt,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    },
  })
}

export async function updateUserRole(req, res) {
  const { userId } = req.params
  const { role } = req.body ?? {}

  if (!validUserId(userId)) {
    return res.status(400).json({ success: false, message: 'Mã tài khoản không hợp lệ.' })
  }
  if (role !== 'user' && role !== 'admin') {
    return res.status(400).json({ success: false, message: 'Role chỉ nhận user hoặc admin.' })
  }
  if (isCurrentAdmin(req, userId) && role !== 'admin') {
    return res.status(409).json({ success: false, message: 'Bạn không thể tự hạ quyền admin của mình.' })
  }

  const user = await User.findById(userId)
  if (!user) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' })
  }

  if (user.role === 'admin' && role === 'user' && user.isActive !== false) {
    const activeAdmins = await User.countDocuments(activeAdminFilter())
    if (activeAdmins <= 1) {
      return res.status(409).json({ success: false, message: 'Không thể hạ quyền admin đang hoạt động cuối cùng.' })
    }
  }

  user.role = role
  await user.save()
  return res.json({ success: true, data: { id: user._id, role: user.role } })
}

export async function updateUserStatus(req, res) {
  const { userId } = req.params
  const { isActive } = req.body ?? {}

  if (!validUserId(userId)) {
    return res.status(400).json({ success: false, message: 'Mã tài khoản không hợp lệ.' })
  }
  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ success: false, message: 'isActive phải là true hoặc false.' })
  }
  if (isCurrentAdmin(req, userId) && !isActive) {
    return res.status(409).json({ success: false, message: 'Bạn không thể tự khóa tài khoản admin của mình.' })
  }

  const user = await User.findById(userId)
  if (!user) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' })
  }

  if (user.role === 'admin' && user.isActive !== false && !isActive) {
    const activeAdmins = await User.countDocuments(activeAdminFilter())
    if (activeAdmins <= 1) {
      return res.status(409).json({ success: false, message: 'Không thể khóa admin đang hoạt động cuối cùng.' })
    }
  }

  user.isActive = isActive
  await user.save()
  return res.json({ success: true, data: { id: user._id, isActive: user.isActive } })
}

export async function deleteUser(req, res) {
  const { userId } = req.params

  if (!validUserId(userId)) {
    return res.status(400).json({ success: false, message: 'Mã tài khoản không hợp lệ.' })
  }
  if (isCurrentAdmin(req, userId)) {
    return res.status(409).json({ success: false, message: 'Bạn không thể xóa tài khoản admin đang đăng nhập.' })
  }

  const user = await User.findById(userId)
  if (!user) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' })
  }

  if (user.role === 'admin' && user.isActive !== false) {
    const activeAdmins = await User.countDocuments(activeAdminFilter())
    if (activeAdmins <= 1) {
      return res.status(409).json({ success: false, message: 'Không thể xóa admin đang hoạt động cuối cùng.' })
    }
  }

  await user.deleteOne()
  return res.json({ success: true, data: { id: user._id } })
}
