import express from 'express'
import {
  createProperty,
  deleteProperty,
  getMapProperties,
  getMapStats,
  getMyProperties,
  getPropertyById,
  searchProperties,
  updateProperty
} from '../controllers/propertyController.js'
import { authorizeRoles, protect } from '../middleware/authMiddleware.js'
import { getNeighbourhoodInsightByProperty, refreshNeighbourhoodInsight } from '../controllers/neighbourhoodController.js'

const router = express.Router()

router.get('/search', searchProperties)
router.get('/map', getMapProperties)
router.get('/stats', getMapStats)
router.get('/mine', protect, authorizeRoles('manager'), getMyProperties)
router.get('/:id/neighbourhood-insights', getNeighbourhoodInsightByProperty)
router.post('/:id/neighbourhood-insights/refresh', protect, authorizeRoles('manager'), refreshNeighbourhoodInsight)
router.post('/', protect, authorizeRoles('manager'), createProperty)
router.put('/:id', protect, authorizeRoles('manager'), updateProperty)
router.delete('/:id', protect, authorizeRoles('manager'), deleteProperty)
router.get('/:id', getPropertyById)

export default router
