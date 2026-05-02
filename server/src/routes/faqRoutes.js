import express from 'express'
import { getTenantFaqs, searchTenantFaqs } from '../controllers/faqController.js'
import { authorizeRoles, protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/tenant', protect, authorizeRoles('tenant'), getTenantFaqs)
router.get('/tenant/search', protect, authorizeRoles('tenant'), searchTenantFaqs)

export default router
