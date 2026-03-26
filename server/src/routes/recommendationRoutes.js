import express from 'express'
import { protect, authorizeRoles } from '../middleware/authMiddleware.js'
import {
  getPreferenceSnapshot,
  getRecommendations,
  markRecommendationFeedback
} from '../controllers/recommendationController.js'
import { addBookmark, getBookmarks, removeBookmark } from '../controllers/bookmarkController.js'

const router = express.Router()

router.use(protect)
router.use(authorizeRoles('tenant'))

router.get('/', getRecommendations)
router.get('/favorites', getBookmarks)
router.get('/preferences', getPreferenceSnapshot)
router.post('/favorites', addBookmark)
router.delete('/favorites/:propertyId', removeBookmark)
router.post('/:recommendationId/feedback', markRecommendationFeedback)

export default router
