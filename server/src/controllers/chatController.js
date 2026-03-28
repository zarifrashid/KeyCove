import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'
import Property from '../models/Property.js'
import { emitToUsers, registerChatStream, removeChatStream } from '../services/chat/realtime.js'
import { getViewerRoleInConversation, isConversationParticipant } from '../utils/chatAccess.js'

function getConversationUnreadForUser(conversation, userId) {
  const viewerRole = getViewerRoleInConversation(conversation, userId)
  if (viewerRole === 'tenant') return conversation.unreadCountTenant || 0
  if (viewerRole === 'manager') return conversation.unreadCountManager || 0
  return 0
}

function mapConversation(conversation, userId) {
  const viewerRole = getViewerRoleInConversation(conversation, userId)
  const isTenantViewer = viewerRole === 'tenant'
  const otherUser = isTenantViewer ? conversation.manager : conversation.tenant

  return {
    _id: conversation._id,
    property: conversation.property,
    tenant: conversation.tenant,
    manager: conversation.manager,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    lastMessageAt: conversation.lastMessageAt,
    lastMessageText: conversation.lastMessageText || '',
    lastSender: conversation.lastSender,
    unreadCount: getConversationUnreadForUser(conversation, userId),
    unreadCountTenant: conversation.unreadCountTenant || 0,
    unreadCountManager: conversation.unreadCountManager || 0,
    viewerRole,
    otherUser
  }
}

function mapMessage(message) {
  return {
    _id: message._id,
    conversation: message.conversation,
    sender: message.sender,
    content: message.content,
    messageType: message.messageType,
    isRead: message.isRead,
    readAt: message.readAt,
    sentAt: message.sentAt,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt
  }
}

async function findConversationForUser(conversationId, userId) {
  const conversation = await Conversation.findById(conversationId)
    .populate('property', 'title image images location price listingType status')
    .populate('tenant', 'name email role')
    .populate('manager', 'name email role')

  if (!conversation) return null
  if (!isConversationParticipant(conversation, userId)) return false
  return conversation
}

async function emitConversationRefresh(conversationId) {
  const populatedConversation = await Conversation.findById(conversationId)
    .populate('property', 'title image images location price listingType status')
    .populate('tenant', 'name email role')
    .populate('manager', 'name email role')

  if (!populatedConversation) return

  const tenantId = populatedConversation.tenant?._id?.toString?.() || populatedConversation.tenant?.toString?.()
  const managerId = populatedConversation.manager?._id?.toString?.() || populatedConversation.manager?.toString?.()

  if (tenantId) {
    emitToUsers([tenantId], 'chat:conversationUpdated', { conversation: mapConversation(populatedConversation, tenantId) })
    emitToUsers([tenantId], 'chat:unreadSummaryUpdated', {
      unreadTotal: populatedConversation.unreadCountTenant || 0,
      conversationId: populatedConversation._id
    })
  }

  if (managerId) {
    emitToUsers([managerId], 'chat:conversationUpdated', { conversation: mapConversation(populatedConversation, managerId) })
    emitToUsers([managerId], 'chat:unreadSummaryUpdated', {
      unreadTotal: populatedConversation.unreadCountManager || 0,
      conversationId: populatedConversation._id
    })
  }
}

export async function createOrGetConversation(req, res) {
  try {
    if (req.user.role !== 'tenant') {
      return res.status(403).json({ message: 'Only tenants can start chats from properties.' })
    }

    const propertyId = req.body?.propertyId
    if (!propertyId) {
      return res.status(400).json({ message: 'Property id is required.' })
    }

    const property = await Property.findById(propertyId).populate('manager', 'name email role')
    if (!property || property.status === 'deleted') {
      return res.status(404).json({ message: 'Property not found.' })
    }

    if (!property.manager?._id) {
      return res.status(400).json({ message: 'This property has no assigned manager.' })
    }

    if (property.manager._id.toString() === req.user.userId) {
      return res.status(400).json({ message: 'You cannot start a chat with yourself.' })
    }

    let conversation = await Conversation.findOne({
      property: property._id,
      tenant: req.user.userId,
      manager: property.manager._id
    })
      .populate('property', 'title image images location price listingType status')
      .populate('tenant', 'name email role')
      .populate('manager', 'name email role')

    if (!conversation) {
      try {
        conversation = await Conversation.create({
          property: property._id,
          tenant: req.user.userId,
          manager: property.manager._id,
          lastMessageAt: new Date(),
          lastMessageText: '',
          unreadCountTenant: 0,
          unreadCountManager: 0
        })
      } catch (error) {
        if (error?.code === 11000) {
          conversation = await Conversation.findOne({
            property: property._id,
            tenant: req.user.userId,
            manager: property.manager._id
          })
        } else {
          throw error
        }
      }

      conversation = await Conversation.findById(conversation._id)
        .populate('property', 'title image images location price listingType status')
        .populate('tenant', 'name email role')
        .populate('manager', 'name email role')
    }

    res.status(200).json({ conversation: mapConversation(conversation, req.user.userId) })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to open conversation.' })
  }
}

export async function getUserConversations(req, res) {
  try {
    const query = req.user.role === 'manager'
      ? { manager: req.user.userId, isActive: true }
      : { tenant: req.user.userId, isActive: true }

    const conversations = await Conversation.find(query)
      .populate('property', 'title image images location price listingType status')
      .populate('tenant', 'name email role')
      .populate('manager', 'name email role')
      .sort({ lastMessageAt: -1, updatedAt: -1 })

    res.status(200).json({
      conversations: conversations.map((conversation) => mapConversation(conversation, req.user.userId))
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load conversations.' })
  }
}

export async function getConversationMessages(req, res) {
  try {
    const conversation = await findConversationForUser(req.params.conversationId, req.user.userId)

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' })
    }

    if (conversation === false) {
      return res.status(403).json({ message: 'You cannot access this conversation.' })
    }

    const messages = await Message.find({ conversation: conversation._id })
      .populate('sender', 'name email role')
      .sort({ sentAt: 1, createdAt: 1 })

    res.status(200).json({
      conversation: mapConversation(conversation, req.user.userId),
      messages: messages.map(mapMessage)
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load messages.' })
  }
}

export async function sendMessage(req, res) {
  try {
    const conversation = await findConversationForUser(req.params.conversationId, req.user.userId)

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' })
    }

    if (conversation === false) {
      return res.status(403).json({ message: 'You cannot send a message to this conversation.' })
    }

    const content = String(req.body?.content || '').trim()
    if (!content) {
      return res.status(400).json({ message: 'Message content cannot be empty.' })
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user.userId,
      content,
      messageType: 'text',
      sentAt: new Date()
    })

    const viewerRole = getViewerRoleInConversation(conversation, req.user.userId)
    if (viewerRole === 'tenant') {
      conversation.unreadCountManager = (conversation.unreadCountManager || 0) + 1
    } else {
      conversation.unreadCountTenant = (conversation.unreadCountTenant || 0) + 1
    }

    conversation.lastMessageAt = message.sentAt
    conversation.lastMessageText = content
    conversation.lastSender = req.user.userId
    await conversation.save()

    const populatedMessage = await Message.findById(message._id).populate('sender', 'name email role')
    const tenantId = conversation.tenant?._id?.toString?.() || conversation.tenant?.toString?.()
    const managerId = conversation.manager?._id?.toString?.() || conversation.manager?.toString?.()

    emitToUsers([tenantId, managerId], 'chat:newMessage', {
      conversationId: conversation._id,
      message: mapMessage(populatedMessage)
    })
    await emitConversationRefresh(conversation._id)

    res.status(201).json({ message: mapMessage(populatedMessage) })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to send message.' })
  }
}

export async function markConversationAsRead(req, res) {
  try {
    const conversation = await findConversationForUser(req.params.conversationId, req.user.userId)

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' })
    }

    if (conversation === false) {
      return res.status(403).json({ message: 'You cannot access this conversation.' })
    }

    const viewerRole = getViewerRoleInConversation(conversation, req.user.userId)
    const senderToMark = viewerRole === 'tenant' ? conversation.manager._id : conversation.tenant._id

    await Message.updateMany(
      {
        conversation: conversation._id,
        sender: senderToMark,
        isRead: false
      },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      }
    )

    if (viewerRole === 'tenant') {
      conversation.unreadCountTenant = 0
    } else {
      conversation.unreadCountManager = 0
    }
    await conversation.save()

    const tenantId = conversation.tenant?._id?.toString?.() || conversation.tenant?.toString?.()
    const managerId = conversation.manager?._id?.toString?.() || conversation.manager?.toString?.()

    emitToUsers([tenantId, managerId], 'chat:messagesRead', {
      conversationId: conversation._id,
      readerId: req.user.userId,
      viewerRole
    })
    await emitConversationRefresh(conversation._id)

    res.status(200).json({ success: true })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to mark messages as read.' })
  }
}

export async function getUnreadSummary(req, res) {
  try {
    const query = req.user.role === 'manager' ? { manager: req.user.userId } : { tenant: req.user.userId }
    const conversations = await Conversation.find(query).select('unreadCountTenant unreadCountManager tenant manager')

    const unreadTotal = conversations.reduce((sum, conversation) => sum + getConversationUnreadForUser(conversation, req.user.userId), 0)

    res.status(200).json({ unreadTotal })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load unread summary.' })
  }
}

export function streamChatEvents(req, res) {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()

  registerChatStream(req.user.userId, res)

  const keepAlive = setInterval(() => {
    res.write(`event: ping\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`)
  }, 25000)

  req.on('close', () => {
    clearInterval(keepAlive)
    removeChatStream(req.user.userId, res)
    res.end()
  })
}
