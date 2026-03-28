import { Router } from 'express'
import { protect } from '../middleware/authMiddleware.js'
import {
  addFavorite,
  getFavoriteProperties,
  getPreferenceSnapshot,
  getRecommendations,
  markRecommendationFeedback,
  removeFavorite,
  saveRecommendationOnboarding
} from '../controllers/recommendationController.js'

const router = Router()

router.use(protect)

router.get('/', getRecommendations)
router.get('/preferences', getPreferenceSnapshot)
router.post('/preferences/onboarding', saveRecommendationOnboarding)
router.post('/:recommendationId/feedback', markRecommendationFeedback)
router.get('/favorites', getFavoriteProperties)
router.post('/favorites', addFavorite)
router.delete('/favorites/:propertyId', removeFavorite)

export default router
