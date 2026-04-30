import Notification from '../../models/Notification.js'
import User from '../../models/User.js'
import { emitNotificationToUsers } from './realtime.js'

export function mapNotification(notification) {
  if (!notification) return null

  return {
    _id: notification._id,
    user: notification.user,
    actor: notification.actor,
    title: notification.title,
    body: notification.body,
    type: notification.type,
    relatedEntityType: notification.relatedEntityType,
    relatedEntityId: notification.relatedEntityId,
    actionUrl: notification.actionUrl,
    priority: notification.priority || 'normal',
    isRead: Boolean(notification.isRead),
    readAt: notification.readAt || null,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt
  }
}

export async function getUnreadNotificationCount(userId) {
  if (!userId) return 0
  return Notification.countDocuments({ user: userId, isRead: false })
}

export async function emitNotificationSummary(userIds) {
  const uniqueUserIds = [...new Set((userIds || []).map((item) => String(item)).filter(Boolean))]

  for (const userId of uniqueUserIds) {
    const unreadCount = await getUnreadNotificationCount(userId)
    emitNotificationToUsers([userId], 'notification:summaryUpdated', { unreadCount })
  }
}

export async function createNotification({
  userId,
  title,
  body = '',
  type = 'system',
  relatedEntityType = '',
  relatedEntityId = null,
  actionUrl = '',
  actorId = null,
  priority = 'normal',
  skipActor = true
}) {
  if (!userId || !title) return null
  if (skipActor && actorId && String(userId) === String(actorId)) return null

  const notification = await Notification.create({
    user: userId,
    actor: actorId || null,
    title,
    body,
    type,
    relatedEntityType,
    relatedEntityId,
    actionUrl,
    priority
  })

  const unreadCount = await getUnreadNotificationCount(userId)

  emitNotificationToUsers([userId], 'notification:new', {
    notification: mapNotification(notification),
    unreadCount
  })

  emitNotificationToUsers([userId], 'notification:summaryUpdated', {
    unreadCount
  })

  return notification
}

export async function createNotificationsForUsers(userIds, payload = {}) {
  const uniqueUserIds = [...new Set((userIds || []).map((item) => String(item)).filter(Boolean))]
  const notifications = []

  for (const userId of uniqueUserIds) {
    const notification = await createNotification({ ...payload, userId })
    if (notification) notifications.push(notification)
  }

  return notifications
}

export async function createBulkNotificationsForUsers(userIds, payload = {}) {
  const uniqueUserIds = [...new Set((userIds || []).map((item) => String(item)).filter(Boolean))]
    .filter((userId) => !(payload.skipActor !== false && payload.actorId && String(userId) === String(payload.actorId)))

  if (!uniqueUserIds.length || !payload.title) return []

  const docs = uniqueUserIds.map((userId) => ({
    user: userId,
    actor: payload.actorId || null,
    title: payload.title,
    body: payload.body || '',
    type: payload.type || 'system',
    relatedEntityType: payload.relatedEntityType || '',
    relatedEntityId: payload.relatedEntityId || null,
    actionUrl: payload.actionUrl || '',
    priority: payload.priority || 'normal'
  }))

  const notifications = await Notification.insertMany(docs)

  for (const userId of uniqueUserIds) {
    const userNotification = notifications.find((item) => String(item.user) === String(userId))
    const unreadCount = await getUnreadNotificationCount(userId)

    emitNotificationToUsers([userId], 'notification:new', {
      notification: mapNotification(userNotification),
      unreadCount
    })

    emitNotificationToUsers([userId], 'notification:summaryUpdated', {
      unreadCount
    })
  }

  return notifications
}

export async function getAdminIds({ exceptUserId = null } = {}) {
  const admins = await User.find({
    role: 'admin',
    accountStatus: { $ne: 'deleted' }
  }).select('_id')

  return admins
    .map((admin) => admin._id.toString())
    .filter((adminId) => !exceptUserId || adminId !== String(exceptUserId))
}

export async function getUserIdsByRole(targetRole = 'all') {
  const filter = { accountStatus: { $ne: 'deleted' } }
  if (targetRole && targetRole !== 'all') filter.role = targetRole

  const users = await User.find(filter).select('_id')
  return users.map((user) => user._id.toString())
}

export function buildRequestActionLabel(actionType = 'rent') {
  if (actionType === 'buy') return 'Buy request'
  if (actionType === 'lease') return 'Lease request'
  return 'Rental request'
}
