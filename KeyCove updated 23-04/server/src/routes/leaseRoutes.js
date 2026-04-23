import express from 'express'
import {
  createLease,
  createLeaseFromRequest,
  getLeaseById,
  getManagerLeases,
  getMyLeases,
  updateLeaseStatus
} from '../controllers/leaseController.js'
import { authorizeRoles, protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/my', protect, authorizeRoles('tenant'), getMyLeases)
router.get('/manager', protect, authorizeRoles('manager'), getManagerLeases)
router.post('/', protect, authorizeRoles('manager'), createLease)
router.post('/from-request/:requestId', protect, authorizeRoles('manager'), createLeaseFromRequest)
router.patch('/:id/status', protect, authorizeRoles('manager'), updateLeaseStatus)
router.get('/:id', protect, getLeaseById)

export default router
