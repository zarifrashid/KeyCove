function formatDateTime(value) {
  if (!value) return 'Just now'
  return new Date(value).toLocaleString('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

export default function BoardActivityTab({ notifications, onMarkAllRead, busy }) {
  return (
    <section className="card shared-board-tab-card">
      <div className="shared-board-activity-header">
        <div>
          <h2>Board Activity</h2>
          <p>Invite events, property saves, comments, and votes appear here for the current member.</p>
        </div>
        <button type="button" className="secondary-btn" onClick={onMarkAllRead} disabled={busy}>{busy ? 'Saving...' : 'Mark Activity Read'}</button>
      </div>

      <div className="shared-board-activity-list">
        {notifications.map((notification) => (
          <article key={notification._id} className={`shared-board-activity-card ${notification.isRead ? '' : 'unread'}`}>
            <div className="shared-board-activity-top">
              <strong>{notification.title}</strong>
              {!notification.isRead ? <span className="badge">New</span> : null}
            </div>
            <p>{notification.body || 'Board activity update'}</p>
            <span>{notification.actor?.name ? `${notification.actor.name} · ` : ''}{formatDateTime(notification.createdAt)}</span>
          </article>
        ))}
        {!notifications.length ? <p className="muted-text">No activity yet. Invite members or add properties to begin collaboration.</p> : null}
      </div>
    </section>
  )
}
