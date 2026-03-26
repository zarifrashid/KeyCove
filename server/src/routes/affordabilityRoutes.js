import express from 'express'
import { authorizeRoles, protect } from '../middleware/authMiddleware.js'
import {
  calculateAffordability,
  getAffordabilityHistory,
  getLatestAffordability,
  getPropertyAffordability,
  saveAffordabilityAnalysis
} from '../controllers/affordabilityController.js'

const router = express.Router()

router.use(protect)
router.use(authorizeRoles('tenant'))

router.get('/latest', getLatestAffordability)
router.get('/history', getAffordabilityHistory)
router.get('/property/:propertyId', getPropertyAffordability)
router.post('/calculate', calculateAffordability)
router.post('/save', saveAffordabilityAnalysis)

export default router
