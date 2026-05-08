import express from 'express'
import {
  getMe,
  loginUser,
  logoutUser,
  registerUser,
  resendVerificationEmail,
  verifyEmail
} from '../controllers/authController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/logout', logoutUser)
router.post('/verify-email', verifyEmail)
router.get('/verify-email/:token', verifyEmail)
router.post('/resend-verification', resendVerificationEmail)
router.get('/me', protect, getMe)

export default router
