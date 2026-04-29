import express from 'express'
import { authorizeRoles, protect } from '../middleware/authMiddleware.js'
import {
  getMyManagerVerification,
  submitManagerVerification
} from '../controllers/managerVerificationController.js'

const router = express.Router()

router.use(protect)
router.use(authorizeRoles('manager'))

router.get('/me', getMyManagerVerification)
router.post('/submit', submitManagerVerification)

export default router
