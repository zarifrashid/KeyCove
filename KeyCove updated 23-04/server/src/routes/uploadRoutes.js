import express from 'express'
import { uploadPropertyImages } from '../controllers/uploadController.js'
import { authorizeRoles, protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/property-images', protect, authorizeRoles('manager'), uploadPropertyImages)

export default router
