import express from 'express'
import { protect, authorizeRoles } from '../middleware/authMiddleware.js'
import {
<<<<<<< HEAD
  getPreferenceSnapshot,
  getRecommendations,
  markRecommendationFeedback
} from '../controllers/recommendationController.js'
import { addBookmark, getBookmarks, removeBookmark } from '../controllers/bookmarkController.js'
=======
  addFavorite,
  getFavoriteProperties,
  getPreferenceSnapshot,
  getRecommendations,
  markRecommendationFeedback,
  removeFavorite
} from '../controllers/recommendationController.js'
>>>>>>> origin/main

const router = express.Router()

router.use(protect)
router.use(authorizeRoles('tenant'))

router.get('/', getRecommendations)
<<<<<<< HEAD
router.get('/favorites', getBookmarks)
router.get('/preferences', getPreferenceSnapshot)
router.post('/favorites', addBookmark)
router.delete('/favorites/:propertyId', removeBookmark)
=======
router.get('/favorites', getFavoriteProperties)
router.get('/preferences', getPreferenceSnapshot)
router.post('/favorites', addFavorite)
router.delete('/favorites/:propertyId', removeFavorite)
>>>>>>> origin/main
router.post('/:recommendationId/feedback', markRecommendationFeedback)

export default router
