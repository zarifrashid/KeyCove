import express from 'express'
import { protect, authorizeRoles } from '../middleware/authMiddleware.js'
import {
  addFavorite,
  getFavoriteProperties,
  getPreferenceSnapshot,
  getRecommendations,
  markRecommendationFeedback,
  removeFavorite
} from '../controllers/recommendationController.js'

const router = express.Router()

router.use(protect)
router.use(authorizeRoles('tenant'))

router.get('/', getRecommendations)
router.get('/favorites', getFavoriteProperties)
router.get('/preferences', getPreferenceSnapshot)
router.post('/favorites', addFavorite)
router.delete('/favorites/:propertyId', removeFavorite)
router.post('/:recommendationId/feedback', markRecommendationFeedback)

export default router
