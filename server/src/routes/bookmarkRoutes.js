import express from 'express'
import { protect, authorizeRoles } from '../middleware/authMiddleware.js'
import { addBookmark, getBookmarks, removeBookmark } from '../controllers/bookmarkController.js'

const router = express.Router()

router.use(protect)
router.use(authorizeRoles('tenant'))

router.get('/', getBookmarks)
router.post('/', addBookmark)
router.delete('/:propertyId', removeBookmark)

export default router
