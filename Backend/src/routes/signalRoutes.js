import { Router } from 'express'
import { createSignal, getSignalById, getSignals } from '../controllers/signalController.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

router.use(requireAuth)
router.get('/', getSignals)
router.get('/:id', getSignalById)
router.post('/', createSignal)

export default router
