import express from 'express'
import {
  addBoardComment,
  addBoardItem,
  createBoard,
  getBoardDetails,
  getBoardSummary,
  getMyBoards,
  getPendingInvitations,
  inviteBoardMember,
  leaveBoard,
  markBoardNotificationsRead,
  removeBoardItem,
  respondToInvitation,
  searchTenantUsers,
  streamBoardEvents,
  voteBoardItem
} from '../controllers/boardController.js'
import { authorizeRoles, protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/stream', protect, authorizeRoles('tenant'), streamBoardEvents)
router.get('/summary', protect, authorizeRoles('tenant'), getBoardSummary)
router.get('/users/search', protect, authorizeRoles('tenant'), searchTenantUsers)
router.get('/invitations/pending', protect, authorizeRoles('tenant'), getPendingInvitations)
router.patch('/invitations/:memberId/respond', protect, authorizeRoles('tenant'), respondToInvitation)
router.get('/', protect, authorizeRoles('tenant'), getMyBoards)
router.post('/', protect, authorizeRoles('tenant'), createBoard)
router.get('/:boardId', protect, authorizeRoles('tenant'), getBoardDetails)
router.post('/:boardId/invite', protect, authorizeRoles('tenant'), inviteBoardMember)
router.post('/:boardId/items', protect, authorizeRoles('tenant'), addBoardItem)
router.delete('/:boardId/items/:itemId', protect, authorizeRoles('tenant'), removeBoardItem)
router.post('/items/:itemId/comments', protect, authorizeRoles('tenant'), addBoardComment)
router.post('/items/:itemId/vote', protect, authorizeRoles('tenant'), voteBoardItem)
router.delete('/:boardId/members/me', protect, authorizeRoles('tenant'), leaveBoard)
router.patch('/:boardId/notifications/read-all', protect, authorizeRoles('tenant'), markBoardNotificationsRead)

export default router
