import Notification from '../models/Notification.js'
import Announcement from '../models/Announcement.js'
import {
  emitNotificationSummary,
  getUnreadNotificationCount,
  mapNotification
} from '../services/notifications/notificationService.js'
import {
  registerNotificationStream,
  removeNotificationStream
} from '../services/notifications/realtime.js'

function normalizeString(value, fallback = '') {
  if (value === null || value === undefined) return fallback
  return String(value).trim()
}

export async function getMyNotifications(req, res) {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '20', 10)))
    const page = Math.max(1, parseInt(req.query.page || '1', 10))
    const type = normalizeString(req.query.type)
    const filter = { user: req.user.userId }

    if (req.query.unread === 'true') filter.isRead = false
    if (type && ['message', 'application', 'system', 'lease', 'payment', 'announcement'].includes(type)) {
      filter.type = type
    }

    const [notifications, unreadCount, total] = await Promise.all([
      Notification.find(filter)
        .populate('actor', 'name email role')
        .sort({ isRead: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      getUnreadNotificationCount(req.user.userId),
      Notification.countDocuments(filter)
    ])

    res.status(200).json({
      success: true,
      notifications: notifications.map(mapNotification),
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load notifications.' })
  }
}

export async function getNotificationSummary(req, res) {
  try {
    const unreadCount = await getUnreadNotificationCount(req.user.userId)
    res.status(200).json({ success: true, unreadCount })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load notification summary.' })
  }
}

export async function markNotificationRead(req, res) {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.userId
    })

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' })
    }

    if (!notification.isRead) {
      notification.isRead = true
      notification.readAt = new Date()
      await notification.save()
    }

    const unreadCount = await getUnreadNotificationCount(req.user.userId)
    await emitNotificationSummary([req.user.userId])

    res.status(200).json({
      success: true,
      notification: mapNotification(notification),
      unreadCount
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to mark notification read.' })
  }
}

export async function markAllNotificationsRead(req, res) {
  try {
    await Notification.updateMany(
      { user: req.user.userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    )

    await emitNotificationSummary([req.user.userId])
    res.status(200).json({ success: true, unreadCount: 0 })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to mark all notifications read.' })
  }
}

export async function deleteNotification(req, res) {
  try {
    const deleted = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId
    })

    if (!deleted) {
      return res.status(404).json({ message: 'Notification not found.' })
    }

    const unreadCount = await getUnreadNotificationCount(req.user.userId)
    await emitNotificationSummary([req.user.userId])

    res.status(200).json({ success: true, unreadCount })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete notification.' })
  }
}

export async function getAnnouncementById(req, res) {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('createdByAdmin', 'name email role')
      .lean()

    if (!announcement || !announcement.isActive) {
      return res.status(404).json({ message: 'Announcement not found.' })
    }

    const targetRole = announcement.targetRole || 'all'
    if (targetRole !== 'all' && targetRole !== req.user.role) {
      return res.status(403).json({ message: 'You cannot view this announcement.' })
    }

    res.status(200).json({ success: true, announcement })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load announcement.' })
  }
}

export function streamNotificationEvents(req, res) {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()

  registerNotificationStream(req.user.userId, res)

  const keepAlive = setInterval(() => {
    res.write(`event: ping\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`)
  }, 25000)

  req.on('close', () => {
    clearInterval(keepAlive)
    removeNotificationStream(req.user.userId, res)
    res.end()
  })
}
