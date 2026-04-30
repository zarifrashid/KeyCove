import Lease from '../../models/Lease.js'
import Notification from '../../models/Notification.js'
import { createNotification } from './notificationService.js'

const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_INTERVAL_MS = 12 * 60 * 60 * 1000

async function createLeaseNotificationOnce({ userId, title, body, leaseId, actionUrl, priority = 'normal' }) {
  if (!userId || !leaseId) return null

  const existing = await Notification.findOne({
    user: userId,
    type: 'lease',
    relatedEntityType: 'lease',
    relatedEntityId: leaseId,
    title
  }).select('_id')

  if (existing) return null

  return createNotification({
    userId,
    title,
    body,
    type: 'lease',
    relatedEntityType: 'lease',
    relatedEntityId: leaseId,
    actionUrl,
    priority,
    skipActor: false
  })
}

export async function runLeaseNotificationScan() {
  const now = new Date()
  const endingSoonDate = new Date(now.getTime() + 7 * DAY_MS)

  const endingSoonLeases = await Lease.find({
    status: { $in: ['active', 'pending'] },
    endDate: { $gte: now, $lte: endingSoonDate }
  })
    .populate('property', 'title')
    .select('tenant manager property endDate status')
    .lean()

  for (const lease of endingSoonLeases) {
    const propertyTitle = lease.property?.title || 'your property'
    const readableEndDate = new Date(lease.endDate).toLocaleDateString()

    await createLeaseNotificationOnce({
      userId: lease.tenant,
      title: 'Lease ending soon',
      body: `Your lease for ${propertyTitle} ends on ${readableEndDate}.`,
      leaseId: lease._id,
      actionUrl: `/leases/${lease._id}`,
      priority: 'high'
    })

    await createLeaseNotificationOnce({
      userId: lease.manager,
      title: 'Lease ending soon',
      body: `The lease for ${propertyTitle} ends on ${readableEndDate}.`,
      leaseId: lease._id,
      actionUrl: '/manager/leases',
      priority: 'high'
    })
  }

  const expiredLeases = await Lease.find({
    status: { $in: ['active', 'pending'] },
    endDate: { $lt: now }
  })
    .populate('property', 'title')
    .select('tenant manager property endDate status')
    .lean()

  for (const lease of expiredLeases) {
    const propertyTitle = lease.property?.title || 'your property'

    await createLeaseNotificationOnce({
      userId: lease.tenant,
      title: 'Lease may be expired',
      body: `Your lease for ${propertyTitle} has passed its end date.`,
      leaseId: lease._id,
      actionUrl: `/leases/${lease._id}`,
      priority: 'high'
    })

    await createLeaseNotificationOnce({
      userId: lease.manager,
      title: 'Lease may be expired',
      body: `The lease for ${propertyTitle} has passed its end date.`,
      leaseId: lease._id,
      actionUrl: '/manager/leases',
      priority: 'high'
    })
  }
}

export function startLeaseNotificationScheduler() {
  if (process.env.ENABLE_LEASE_NOTIFICATION_SCHEDULER === 'false') return

  runLeaseNotificationScan().catch((error) => {
    console.warn('Lease notification scan failed:', error.message)
  })

  const intervalMs = Number(process.env.LEASE_NOTIFICATION_SCAN_INTERVAL_MS) || DEFAULT_INTERVAL_MS
  setInterval(() => {
    runLeaseNotificationScan().catch((error) => {
      console.warn('Lease notification scan failed:', error.message)
    })
  }, intervalMs)
}
