import express from 'express'
import {
  getComparisonBoard,
  getDecisionNoteByProperty,
  getDecisionNotes,
  getTrustBadge,
  toggleCompareSelection,
  upsertDecisionNote
} from '../controllers/decisionHubController.js'
import { authorizeRoles, protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/compare/list', protect, authorizeRoles('tenant'), getComparisonBoard)
router.get('/trust/:propertyId', protect, getTrustBadge)
router.get('/', protect, authorizeRoles('tenant'), getDecisionNotes)
router.get('/:propertyId', protect, authorizeRoles('tenant'), getDecisionNoteByProperty)
router.post('/:propertyId', protect, authorizeRoles('tenant'), upsertDecisionNote)
router.patch('/:propertyId/compare', protect, authorizeRoles('tenant'), toggleCompareSelection)

export default router
