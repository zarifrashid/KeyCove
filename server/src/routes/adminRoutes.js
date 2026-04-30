import express from 'express'
import { protect, authorizeRoles } from '../middleware/authMiddleware.js'
import {
  changeUserRole,
  createAdminUser,
  createAnnouncement,
  getAdminOverview,
  listManagerVerifications,
  listRoleAssignments,
  listUsers,
  restoreUser,
  reviewManagerVerification,
  softDeleteUser,
  suspendUser
} from '../controllers/adminController.js'

const router = express.Router()

router.use(protect)
router.use(authorizeRoles('admin'))

router.get('/overview', getAdminOverview)
router.get('/users', listUsers)
router.post('/users/create-admin', createAdminUser)
router.post('/announcements', createAnnouncement)
router.patch('/users/:id/suspend', suspendUser)
router.patch('/users/:id/restore', restoreUser)
router.delete('/users/:id', softDeleteUser)
router.patch('/users/:id/role', changeUserRole)
router.get('/role-assignments', listRoleAssignments)
router.get('/verifications', listManagerVerifications)
router.patch('/verifications/:id/review', reviewManagerVerification)

export default router
