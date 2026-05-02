import express from 'express'
import {
  addRecentlyViewed,
  clearRecentlyViewed,
  getRecentlyViewed,
  removeRecentlyViewed
} from '../controllers/recentlyViewedController.js'
import { authorizeRoles, protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/', protect, authorizeRoles('tenant'), addRecentlyViewed)
router.get('/', protect, authorizeRoles('tenant'), getRecentlyViewed)
router.delete('/:propertyId', protect, authorizeRoles('tenant'), removeRecentlyViewed)
router.delete('/', protect, authorizeRoles('tenant'), clearRecentlyViewed)

export default router
