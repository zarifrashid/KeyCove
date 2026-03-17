import express from 'express'
import { getMapProperties, getMapStats, getPropertyById } from '../controllers/propertyController.js'

const router = express.Router()

router.get('/map', getMapProperties)
router.get('/stats', getMapStats)
router.get('/:id', getPropertyById)

export default router
