import { Link } from 'react-router-dom'

function formatMoney(value, suffix = '') {
  const amount = `৳ ${Number(value || 0).toLocaleString()}`
  return suffix ? `${amount} ${suffix}` : amount
}

export default function RoommateGroupCard({ group, onApply }) {
  const host = group?.creator || {}
  const preferences = group?.preferences || {}
  const acceptedMembers = group?.acceptedMembers || []
  const viewerState = group?.viewerState || {}

  return (
    <article className="roommate-group-card">
      <div className="roommate-group-card-top">
        <div>
          <p className="badge">{(group?.actionType || 'rent').toUpperCase()} GROUP</p>
          <h3>{group?.property?.title || 'Roommate group'}</h3>
          <p>Hosted by <strong>{host.name || 'Tenant'}</strong>{host.applicationProfile?.occupation ? ` - ${host.applicationProfile.occupation}` : ''}</p>
        </div>
        <span className={`manager-status-badge status-${group?.status || 'open'}`}>{group?.status || 'open'}</span>
      </div>

      <div className="roommate-group-stats">
        <p><span>Confirmed</span><strong>{group?.acceptedMemberCount || 0}/{group?.targetGroupSize || 0}</strong></p>
        <p><span>Needed</span><strong>{group?.remainingSlots || 0}</strong></p>
        <p><span>Per person</span><strong>{formatMoney(group?.rentPerPerson, '/ month')}</strong></p>
      </div>

      <div className="roommate-group-preferences">
        {preferences.preferredGender ? <span>Gender: {preferences.preferredGender}</span> : null}
        {preferences.preferredOccupation ? <span>Occupation: {preferences.preferredOccupation}</span> : null}
        {preferences.cleanlinessPreference ? <span>Cleanliness: {preferences.cleanlinessPreference}</span> : null}
        {preferences.smokingPreference ? <span>Smoking: {preferences.smokingPreference}</span> : null}
        {preferences.petPreference ? <span>Pets: {preferences.petPreference}</span> : null}
      </div>

      {group?.introMessage ? <p className="roommate-muted">{group.introMessage}</p> : null}

      {acceptedMembers.length ? (
        <div className="roommate-member-chips">
          {acceptedMembers.slice(0, 4).map((member) => (
            <span key={member._id || member.user}>{member.name}{member.occupation ? ` - ${member.occupation}` : ''}</span>
          ))}
        </div>
      ) : null}

      <div className="request-action-row">
        <Link to={`/roommate-groups/${group._id}`} className="secondary-btn">View Group</Link>
        {!viewerState.isCreator && !viewerState.isAcceptedMember && !viewerState.alreadyApplied && group.remainingSlots > 0 ? (
          <button type="button" className="primary-btn" onClick={() => onApply?.(group)}>Apply to Join</button>
        ) : null}
        {viewerState.alreadyApplied ? <span className="roommate-state-label">Request pending</span> : null}
      </div>
    </article>
  )
}
