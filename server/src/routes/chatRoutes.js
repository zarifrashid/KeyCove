import express from 'express'
import {
  createOrGetConversation,
  getConversationMessages,
  getUnreadSummary,
  getUserConversations,
  markConversationAsRead,
  sendMessage,
  streamChatEvents
} from '../controllers/chatController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/stream', protect, streamChatEvents)
router.get('/unread-summary', protect, getUnreadSummary)
router.post('/conversations', protect, createOrGetConversation)
router.get('/conversations', protect, getUserConversations)
router.get('/conversations/:conversationId/messages', protect, getConversationMessages)
router.post('/conversations/:conversationId/messages', protect, sendMessage)
router.patch('/conversations/:conversationId/read', protect, markConversationAsRead)

export default router
