import { Router } from 'express'
import { getCurrentUser, login, register } from '../controllers/authController.js'
import { linkTelegram } from '../controllers/userController.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', requireAuth, getCurrentUser)

// Route để Bot Python (hoặc Frontend) gọi vào để lưu telegramChatId
router.post('/link-telegram', linkTelegram)

export default router