export default function BoardHeader({ board, canInvite, onInvite, onLeave }) {
  return (
    <section className="card shared-board-header-card">
      <div className="shared-board-header-top">
        <div>
          <p className="badge">Collaborative Shared Search</p>
          <h1>{board?.title || 'Shared Board'}</h1>
          <p className="shared-board-header-copy">{board?.description || 'Save properties together, invite members, comment on listings, and vote as a group.'}</p>
        </div>
        <div className="shared-board-header-actions">
          {canInvite ? <button type="button" className="primary-btn" onClick={onInvite}>Invite Member</button> : null}
          <button type="button" className="secondary-btn" onClick={onLeave}>Leave Board</button>
        </div>
      </div>

      <div className="shared-board-stats-grid">
        <article className="shared-board-stat-card">
          <span>Owner</span>
          <strong>{board?.owner?.name || 'Unknown'}</strong>
        </article>
        <article className="shared-board-stat-card">
          <span>Members</span>
          <strong>{board?.acceptedMemberCount || 0}</strong>
        </article>
        <article className="shared-board-stat-card">
          <span>Properties</span>
          <strong>{board?.propertyCount || 0}</strong>
        </article>
        <article className="shared-board-stat-card">
          <span>Unread Activity</span>
          <strong>{board?.unreadActivityCount || 0}</strong>
        </article>
      </div>
    </section>
  )
}
