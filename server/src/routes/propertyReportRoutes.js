import express from 'express'
import {
  createPropertyReport,
  getAdminPropertyReportById,
  getAdminPropertyReports,
  getMyPropertyReportById,
  getMyPropertyReports,
  replyToPropertyReport,
  updatePropertyReportStatus
} from '../controllers/propertyReportController.js'
import { authorizeRoles, protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/', protect, authorizeRoles('tenant'), createPropertyReport)
router.get('/my', protect, authorizeRoles('tenant'), getMyPropertyReports)
router.get('/my/:reportId', protect, authorizeRoles('tenant'), getMyPropertyReportById)

router.get('/admin', protect, authorizeRoles('admin'), getAdminPropertyReports)
router.get('/admin/:reportId', protect, authorizeRoles('admin'), getAdminPropertyReportById)
router.patch('/admin/:reportId/reply', protect, authorizeRoles('admin'), replyToPropertyReport)
router.patch('/admin/:reportId/status', protect, authorizeRoles('admin'), updatePropertyReportStatus)

export default router
