import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import JoinRoommateGroupModal from '../components/roommates/JoinRoommateGroupModal'
import JoinRequestReviewCard from '../components/roommates/JoinRequestReviewCard'
import { api } from '../lib/api'

function formatMoney(value, suffix = '') {
  const amount = `৳ ${Number(value || 0).toLocaleString()}`
  return suffix ? `${amount} ${suffix}` : amount
}

function MemberCard({ member, canSeePrivate }) {
  return (
    <article className="roommate-member-card">
      <h4>{member.name || 'Tenant'}</h4>
      <p>{member.occupation || 'Occupation not provided'} {member.employmentStatus ? `- ${member.employmentStatus}` : ''}</p>
      <p><strong>Type:</strong> {member.memberType?.replaceAll('_', ' ')}</p>
      <p><strong>Contribution:</strong> {member.expectedContribution ? formatMoney(member.expectedContribution) : 'Not provided'}</p>
      {canSeePrivate ? (
        <>
          <p><strong>Email:</strong> {member.email || 'Not provided'}</p>
          <p><strong>Phone:</strong> {member.phone || 'Not provided'}</p>
        </>
      ) : null}
    </article>
  )
}

export default function RoommateGroupDetailsPage() {
  const { groupId } = useParams()
  const [state, setState] = useState({ loading: true, error: '', group: null })
  const [joining, setJoining] = useState(false)

  const fetchGroup = useCallback(async () => {
    try {
      setState((previous) => ({ ...previous, loading: true, error: '' }))
      const { data } = await api.get(`/roommate-groups/${groupId}`)
      setState({ loading: false, error: '', group: data.group })
    } catch (error) {
      setState({ loading: false, error: error.response?.data?.message || 'Failed to load roommate group.', group: null })
    }
  }, [groupId])

  useEffect(() => {
    fetchGroup()
  }, [fetchGroup])

  const cancelGroup = async () => {
    const confirmed = window.confirm('Cancel this roommate group?')
    if (!confirmed) return
    await api.patch(`/roommate-groups/${groupId}/cancel`)
    fetchGroup()
  }

  const leaveGroup = async () => {
    const confirmed = window.confirm('Leave this roommate group?')
    if (!confirmed) return
    await api.delete(`/roommate-groups/${groupId}/members/me`)
    fetchGroup()
  }

  const group = state.group
  const viewerState = group?.viewerState || {}
  const preferences = group?.preferences || {}
  const canApply = group && !viewerState.isCreator && !viewerState.isAcceptedMember && !viewerState.alreadyApplied && group.remainingSlots > 0 && group.applicationMode === 'unknown_roommate_search' && ['open', 'waiting_for_known_roommates'].includes(group.status)

  return (
    <>
      <Navbar />
      <div className="page-wrap dashboard-stack">
        <section className="card roommate-detail-card">
          {state.loading ? <p>Loading roommate group...</p> : null}
          {state.error ? <p className="error-text">{state.error}</p> : null}

          {group ? (
            <>
              <div className="roommate-section-header">
                <div>
                  <p className="badge">Shared Roommate Application</p>
                  <h1>{group.property?.title || 'Roommate group'}</h1>
                  <p>Hosted by <strong>{group.creator?.name || 'Tenant'}</strong>. Applicants can see safe member summaries before acceptance.</p>
                </div>
                <span className={`manager-status-badge status-${group.status}`}>{group.status}</span>
              </div>

              <div className="roommate-detail-grid">
                <div className="roommate-rent-pill"><span>Confirmed</span><strong>{group.acceptedMemberCount}/{group.targetGroupSize}</strong></div>
                <div className="roommate-rent-pill"><span>Remaining slots</span><strong>{group.remainingSlots}</strong></div>
                <div className="roommate-rent-pill"><span>Rent per person</span><strong>{formatMoney(group.rentPerPerson, '/ month')}</strong></div>
                <div className="roommate-rent-pill"><span>Action</span><strong>{group.actionType}</strong></div>
              </div>

              {group.introMessage ? <p className="roommate-intro-box">{group.introMessage}</p> : null}

              <div className="roommate-group-preferences roommate-group-preferences--large">
                {Object.entries(preferences).map(([key, value]) => value ? <span key={key}>{key.replace(/([A-Z])/g, ' $1')}: {value}</span> : null)}
              </div>

              <div className="request-action-row">
                <Link to="/dashboard" className="secondary-btn">Back to Dashboard</Link>
                {canApply ? <button type="button" className="primary-btn" onClick={() => setJoining(true)}>Apply to Join This Group</button> : null}
                {viewerState.alreadyApplied ? <span className="roommate-state-label">Your request is pending.</span> : null}
                {viewerState.isAcceptedMember && !viewerState.isCreator && !['sent_to_manager', 'manager_approved', 'manager_rejected'].includes(group.status) ? (
                  <button type="button" className="secondary-btn" onClick={leaveGroup}>Leave Group</button>
                ) : null}
                {viewerState.isCreator && !['sent_to_manager', 'manager_approved'].includes(group.status) ? (
                  <button type="button" className="secondary-btn" onClick={cancelGroup}>Cancel Group</button>
                ) : null}
              </div>

              <div className="roommate-detail-two-col">
                <section>
                  <h3>Accepted members</h3>
                  <div className="roommate-member-list">
                    {(group.acceptedMembers || []).map((member) => (
                      <MemberCard key={member._id || member.user} member={member} canSeePrivate={viewerState.canSeePrivate} />
                    ))}
                  </div>
                </section>

                {viewerState.canManageRequests ? (
                  <section>
                    <h3>Pending join requests</h3>
                    {!(group.joinRequests || []).filter((request) => request.status === 'pending').length ? <p className="roommate-muted">No pending applicants.</p> : null}
                    {(group.joinRequests || []).filter((request) => request.status === 'pending').map((request) => (
                      <JoinRequestReviewCard key={request._id} request={request} onUpdated={fetchGroup} />
                    ))}
                  </section>
                ) : null}
              </div>
            </>
          ) : null}
        </section>
      </div>

      {joining ? (
        <JoinRoommateGroupModal group={group} onClose={() => setJoining(false)} onSubmitted={fetchGroup} />
      ) : null}
    </>
  )
}
