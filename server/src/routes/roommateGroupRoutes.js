import express from 'express'
import {
  acceptJoinRequestController,
  cancelRoommateGroupController,
  createJoinRequestController,
  createRoommateGroupController,
  getManagerRoommateGroups,
  getMyRoommateGroups,
  getRoommateGroupDetails,
  leaveRoommateGroupController,
  listPropertyRoommateGroups,
  rejectJoinRequestController,
  respondInvitationController,
  searchTenantRoommates
} from '../controllers/roommateGroupController.js'
import { authorizeRoles, protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/tenants/search', protect, authorizeRoles('tenant'), searchTenantRoommates)
router.get('/property/:propertyId', protect, authorizeRoles('tenant'), listPropertyRoommateGroups)
router.post('/', protect, authorizeRoles('tenant'), createRoommateGroupController)
router.get('/mine', protect, authorizeRoles('tenant'), getMyRoommateGroups)
router.get('/manager', protect, authorizeRoles('manager'), getManagerRoommateGroups)
router.post('/:groupId/join-requests', protect, authorizeRoles('tenant'), createJoinRequestController)
router.patch('/join-requests/:requestId/accept', protect, authorizeRoles('tenant'), acceptJoinRequestController)
router.patch('/join-requests/:requestId/reject', protect, authorizeRoles('tenant'), rejectJoinRequestController)
router.patch('/invitations/:memberId/respond', protect, authorizeRoles('tenant'), respondInvitationController)
router.delete('/:groupId/members/me', protect, authorizeRoles('tenant'), leaveRoommateGroupController)
router.patch('/:groupId/cancel', protect, authorizeRoles('tenant'), cancelRoommateGroupController)
router.get('/:groupId', protect, getRoommateGroupDetails)

export default router
