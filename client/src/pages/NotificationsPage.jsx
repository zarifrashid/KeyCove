import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { api } from '../lib/api'
import { useNotifications } from '../context/NotificationContext'

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Unread', value: 'unread' },
  { label: 'Messages', value: 'message' },
  { label: 'Applications', value: 'application' },
  { label: 'Leases', value: 'lease' },
  { label: 'System', value: 'system' },
  { label: 'Announcements', value: 'announcement' }
]

const TYPE_ICONS = {
  message: '💬',
  application: '📄',
  lease: '🏠',
  system: '⚙️',
  announcement: '📢',
  payment: '💳'
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString()
}

export default function NotificationsPage() {
  const { announcementId } = useParams()
  const navigate = useNavigate()
  const {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markRead,
    markAllRead,
    deleteNotification
  } = useNotifications()
  const [filter, setFilter] = useState('')
  const [announcement, setAnnouncement] = useState(null)
  const [pageState, setPageState] = useState({ loadingAnnouncement: false, error: '' })

  useEffect(() => {
    const load = async () => {
      if (filter === 'unread') {
        await loadNotifications({ unread: true })
      } else {
        await loadNotifications({ type: filter })
      }
    }

    load().catch(() => null)
  }, [filter, loadNotifications])

  useEffect(() => {
    if (!announcementId) {
      setAnnouncement(null)
      return
    }

    const loadAnnouncement = async () => {
      try {
        setPageState({ loadingAnnouncement: true, error: '' })
        const { data } = await api.get(`/notifications/announcements/${announcementId}`)
        setAnnouncement(data.announcement || null)
        setPageState({ loadingAnnouncement: false, error: '' })
      } catch (error) {
        setPageState({ loadingAnnouncement: false, error: error.response?.data?.message || 'Failed to load announcement.' })
      }
    }

    loadAnnouncement()
  }, [announcementId])

  const unreadLabel = useMemo(() => unreadCount > 0 ? `${unreadCount} unread` : 'All caught up', [unreadCount])

  const handleClick = async (notification) => {
    if (!notification.isRead) {
      await markRead(notification._id)
    }

    navigate(notification.actionUrl || '/notifications')
  }

  const handleDelete = async (event, notificationId) => {
    event.stopPropagation()
    await deleteNotification(notificationId)
  }

  return (
    <>
      <Navbar />
      <main className="page-wrap notifications-page-wrap">
        <section className="card notifications-hero-card">
          <p className="badge">Real-Time Notification Center</p>
          <div className="notifications-hero-row">
            <div>
              <h1>Notifications</h1>
              <p>Track messages, applications, leases, admin actions, and announcements in one place.</p>
            </div>
            <div className="notifications-hero-actions">
              <span className="notification-unread-summary">{unreadLabel}</span>
              <button type="button" className="secondary-btn" onClick={markAllRead} disabled={!unreadCount}>Mark all read</button>
            </div>
          </div>
        </section>

        {announcementId ? (
          <section className="card announcement-detail-card">
            {pageState.loadingAnnouncement ? <p>Loading announcement...</p> : null}
            {pageState.error ? <p className="error-text">{pageState.error}</p> : null}
            {announcement ? (
              <>
                <p className={`badge announcement-priority-${announcement.priority || 'normal'}`}>{announcement.priority || 'normal'} announcement</p>
                <h2>{announcement.title}</h2>
                <p>{announcement.message}</p>
                <div className="announcement-meta-row">
                  <span>Target: {announcement.targetRole}</span>
                  <span>Sent: {formatDate(announcement.createdAt)}</span>
                  {announcement.expiresAt ? <span>Expires: {formatDate(announcement.expiresAt)}</span> : null}
                </div>
                <Link to="/notifications" className="secondary-btn announcement-back-link">Back to all notifications</Link>
              </>
            ) : null}
          </section>
        ) : null}

        <section className="card notifications-list-card">
          <div className="notification-filter-row">
            {FILTERS.map((item) => (
              <button
                type="button"
                key={item.value || 'all'}
                className={filter === item.value ? 'active' : ''}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {loading ? <p className="center-inline-message">Loading notifications...</p> : null}

          {!loading && notifications.length ? (
            <div className="notification-page-list">
              {notifications.map((notification) => (
                <button
                  type="button"
                  key={notification._id}
                  className={`notification-page-item ${notification.isRead ? 'read' : 'unread'} priority-${notification.priority || 'normal'}`}
                  onClick={() => handleClick(notification)}
                >
                  <span className="notification-type-icon" aria-hidden="true">{TYPE_ICONS[notification.type] || '🔔'}</span>
                  <span className="notification-page-copy">
                    <span className="notification-title-row">
                      {!notification.isRead ? <span className="unread-dot" aria-hidden="true" /> : null}
                      <strong>{notification.title}</strong>
                    </span>
                    {notification.body ? <span>{notification.body}</span> : null}
                    <small>{formatDate(notification.createdAt)}</small>
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    className="notification-delete-btn"
                    onClick={(event) => handleDelete(event, notification._id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') handleDelete(event, notification._id)
                    }}
                    aria-label="Delete notification"
                  >
                    ×
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {!loading && !notifications.length ? <p className="notification-empty full">No notifications found.</p> : null}
        </section>
      </main>
    </>
  )
}
