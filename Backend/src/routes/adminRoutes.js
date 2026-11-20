import { Router } from 'express'
import { deleteUser, listUsers, updateUserRole, updateUserStatus } from '../controllers/adminController.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

router.use(requireAuth, requireAdmin)
router.get('/users', listUsers)
router.patch('/users/:userId/role', updateUserRole)
router.patch('/users/:userId/status', updateUserStatus)
router.delete('/users/:userId', deleteUser)

export default router
