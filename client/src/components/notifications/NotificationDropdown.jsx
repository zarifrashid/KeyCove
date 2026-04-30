import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../context/NotificationContext'

const TYPE_ICONS = {
  message: '💬',
  application: '📄',
  lease: '🏠',
  system: '⚙️',
  announcement: '📢',
  payment: '💳'
}

function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes} min ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hr ago`

  return date.toLocaleDateString()
}

export default function NotificationDropdown({ onClose }) {
  const navigate = useNavigate()
  const {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    deleteNotification
  } = useNotifications()

  const latestNotifications = notifications.slice(0, 8)

  const handleNotificationClick = async (notification) => {
    if (!notification) return

    if (!notification.isRead) {
      await markRead(notification._id)
    }

    onClose?.()
    navigate(notification.actionUrl || '/notifications')
  }

  const handleDelete = async (event, notificationId) => {
    event.stopPropagation()
    await deleteNotification(notificationId)
  }

  const handleMarkAllRead = async () => {
    await markAllRead()
  }

  return (
    <div className="notification-dropdown" role="menu">
      <div className="notification-dropdown-header">
        <div>
          <strong>Notifications</strong>
          <span>{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</span>
        </div>
        <button type="button" onClick={handleMarkAllRead} disabled={!unreadCount}>
          Mark all read
        </button>
      </div>

      <div className="notification-dropdown-list">
        {loading ? <p className="notification-empty">Loading notifications...</p> : null}

        {!loading && latestNotifications.length ? latestNotifications.map((notification) => (
          <button
            type="button"
            key={notification._id}
            className={`notification-item ${notification.isRead ? 'read' : 'unread'} priority-${notification.priority || 'normal'}`}
            onClick={() => handleNotificationClick(notification)}
          >
            <span className="notification-type-icon" aria-hidden="true">
              {TYPE_ICONS[notification.type] || '🔔'}
            </span>
            <span className="notification-copy">
              <span className="notification-title-row">
                {!notification.isRead ? <span className="unread-dot" aria-hidden="true" /> : null}
                <span className="notification-title">{notification.title}</span>
              </span>
              {notification.body ? <span className="notification-body">{notification.body}</span> : null}
              <small>{formatTime(notification.createdAt)}</small>
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
        )) : null}

        {!loading && !latestNotifications.length ? (
          <p className="notification-empty">No notifications yet.</p>
        ) : null}
      </div>

      <button
        type="button"
        className="notification-view-all"
        onClick={() => {
          onClose?.()
          navigate('/notifications')
        }}
      >
        View all notifications
      </button>
    </div>
  )
}
