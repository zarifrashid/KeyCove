import express from 'express'
import { getARSessionByProperty, saveARSession } from '../controllers/arSessionController.js'
import { authorizeRoles, protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/:propertyId', protect, authorizeRoles('tenant', 'manager'), getARSessionByProperty)
router.post('/', protect, authorizeRoles('tenant', 'manager'), saveARSession)

export default router
