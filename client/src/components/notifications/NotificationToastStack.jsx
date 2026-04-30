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

export default function NotificationToastStack() {
  const navigate = useNavigate()
  const { toasts, dismissToast, markRead } = useNotifications()

  const handleToastClick = async (toast) => {
    if (!toast.isRead) {
      await markRead(toast._id)
    }

    dismissToast(toast.toastId)
    navigate(toast.actionUrl || '/notifications')
  }

  if (!toasts.length) return null

  return (
    <div className="notification-toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <button
          type="button"
          className={`notification-toast priority-${toast.priority || 'normal'}`}
          key={toast.toastId}
          onClick={() => handleToastClick(toast)}
        >
          <span className="notification-toast-icon" aria-hidden="true">{TYPE_ICONS[toast.type] || '🔔'}</span>
          <span className="notification-toast-copy">
            <strong>{toast.title}</strong>
            {toast.body ? <span>{toast.body}</span> : null}
          </span>
          <span
            role="button"
            tabIndex={0}
            className="notification-toast-close"
            onClick={(event) => {
              event.stopPropagation()
              dismissToast(toast.toastId)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.stopPropagation()
                dismissToast(toast.toastId)
              }
            }}
            aria-label="Dismiss notification"
          >
            ×
          </span>
        </button>
      ))}
    </div>
  )
}
