import { useEffect, useRef, useState } from 'react'
import { useNotifications } from '../../context/NotificationContext'
import NotificationDropdown from './NotificationDropdown'

export default function NotificationBell({ compact = false }) {
  const { unreadCount } = useNotifications()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const badgeText = unreadCount > 99 ? '99+' : String(unreadCount)

  return (
    <div className={`notification-bell-wrap ${compact ? 'compact' : ''}`} ref={containerRef}>
      <button
        type="button"
        className="notification-bell-btn"
        onClick={() => setOpen((previous) => !previous)}
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
      >
        <span className="notification-bell-icon" aria-hidden="true">🔔</span>
        {unreadCount > 0 ? <span className="notification-badge-count">{badgeText}</span> : null}
      </button>

      {open ? <NotificationDropdown onClose={() => setOpen(false)} /> : null}
    </div>
  )
}
