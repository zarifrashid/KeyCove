import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import {
  deleteNotification,
  getAnnouncementById,
  getMyNotifications,
  getNotificationSummary,
  markAllNotificationsRead,
  markNotificationRead,
  streamNotificationEvents
} from '../controllers/notificationController.js'

const router = express.Router()

router.use(protect)

router.get('/stream', streamNotificationEvents)
router.get('/summary', getNotificationSummary)
router.get('/announcements/:id', getAnnouncementById)
router.get('/', getMyNotifications)
router.patch('/read-all', markAllNotificationsRead)
router.patch('/:id/read', markNotificationRead)
router.delete('/:id', deleteNotification)

export default router
