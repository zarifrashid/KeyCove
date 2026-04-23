import express from 'express'
import {
  createPropertyRequest,
  getApprovedTenantProperties,
  getPropertyRequestPrefill,
  getManagerRequests,
  getMyTenantRequests,
  updatePropertyRequestStatus,
  updateTenantOccupancyStatus
} from '../controllers/propertyRequestController.js'
import { authorizeRoles, protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/prefill/:propertyId', protect, authorizeRoles('tenant'), getPropertyRequestPrefill)
router.post('/', protect, authorizeRoles('tenant'), createPropertyRequest)
router.get('/mine', protect, authorizeRoles('tenant'), getMyTenantRequests)
router.get('/mine/properties', protect, authorizeRoles('tenant'), getApprovedTenantProperties)
router.get('/manager', protect, authorizeRoles('manager'), getManagerRequests)
router.patch('/:id/status', protect, authorizeRoles('manager'), updatePropertyRequestStatus)
router.patch('/:id/occupancy-status', protect, authorizeRoles('tenant'), updateTenantOccupancyStatus)

export default router
