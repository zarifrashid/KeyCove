export default function BoardMembersTab({ acceptedMembers, pendingMembers }) {
  return (
    <div className="shared-board-members-grid">
      <section className="card shared-board-tab-card">
        <div className="property-section-heading">
          <h2>Active Members</h2>
          <p>Accepted collaborators who can add properties, comment, and vote.</p>
        </div>
        <div className="shared-board-member-list">
          {acceptedMembers.map((member) => (
            <article key={member._id} className="shared-board-member-card">
              <div>
                <strong>{member.user?.name || 'Member'}</strong>
                <p>{member.user?.email}</p>
              </div>
              <span className="badge">{member.role === 'owner' ? 'Owner' : 'Member'}</span>
            </article>
          ))}
          {!acceptedMembers.length ? <p className="muted-text">No active members found.</p> : null}
        </div>
      </section>

      <section className="card shared-board-tab-card">
        <div className="property-section-heading">
          <h2>Pending Invitations</h2>
          <p>Members who have not responded yet.</p>
        </div>
        <div className="shared-board-member-list">
          {pendingMembers.map((member) => (
            <article key={member._id} className="shared-board-member-card pending">
              <div>
                <strong>{member.user?.name || 'Pending member'}</strong>
                <p>{member.user?.email}</p>
              </div>
              <span className="badge">Pending</span>
            </article>
          ))}
          {!pendingMembers.length ? <p className="muted-text">No pending invitations.</p> : null}
        </div>
      </section>
    </div>
  )
}
