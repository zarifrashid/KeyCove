import express from 'express'
import { authorizeRoles, protect } from '../middleware/authMiddleware.js'
import {
  getManagerAnalyticsOverview,
  getManagerPropertyAnalytics,
  getManagerPropertyAnalyticsList,
  trackAnalyticsEvent
} from '../controllers/analyticsController.js'

const router = express.Router()

router.post('/track', protect, trackAnalyticsEvent)
router.get('/manager/overview', protect, authorizeRoles('manager'), getManagerAnalyticsOverview)
router.get('/manager/properties', protect, authorizeRoles('manager'), getManagerPropertyAnalyticsList)
router.get('/manager/properties/:propertyId', protect, authorizeRoles('manager'), getManagerPropertyAnalytics)

export default router
