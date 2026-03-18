import express from 'express'
import { getMapProperties, getMapStats, getPropertyById, searchProperties } from '../controllers/propertyController.js'

const router = express.Router()

router.get('/search', searchProperties)
router.get('/map', getMapProperties)
router.get('/stats', getMapStats)
router.get('/:id', getPropertyById)

export default router
