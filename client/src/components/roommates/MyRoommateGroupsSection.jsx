import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import JoinRequestReviewCard from './JoinRequestReviewCard'

function GroupMiniCard({ group, children }) {
  return (
    <article className="roommate-mini-card">
      <div className="roommate-group-card-top">
        <div>
          <p className="badge">{(group?.actionType || 'rent').toUpperCase()} ROOMMATES</p>
          <h4>{group?.property?.title || 'Roommate group'}</h4>
          <p>{group?.acceptedMemberCount || 0}/{group?.targetGroupSize || 0} members confirmed - {group?.remainingSlots || 0} slot(s) left</p>
        </div>
        <span className={`manager-status-badge status-${group?.status || 'open'}`}>{group?.status || 'open'}</span>
      </div>
      <div className="request-action-row">
        <Link to={`/roommate-groups/${group?._id}`} className="secondary-btn">Open Group</Link>
        {children}
      </div>
    </article>
  )
}

export default function MyRoommateGroupsSection() {
  const [state, setState] = useState({ loading: true, error: '', createdGroups: [], memberGroups: [], sentJoinRequests: [], invitations: [] })

  const fetchMine = useCallback(async () => {
    try {
      setState((previous) => ({ ...previous, loading: true, error: '' }))
      const { data } = await api.get('/roommate-groups/mine')
      setState({
        loading: false,
        error: '',
        createdGroups: data.createdGroups || [],
        memberGroups: data.memberGroups || [],
        sentJoinRequests: data.sentJoinRequests || [],
        invitations: data.invitations || []
      })
    } catch (error) {
      setState((previous) => ({ ...previous, loading: false, error: error.response?.data?.message || 'Failed to load roommate groups.' }))
    }
  }, [])

  useEffect(() => {
    fetchMine()
  }, [fetchMine])

  const respondInvitation = async (memberId, response) => {
    await api.patch(`/roommate-groups/invitations/${memberId}/respond`, { response })
    fetchMine()
  }

  return (
    <section className="card manager-dashboard-list-card request-section-card roommate-dashboard-section">
      <div className="manager-list-header">
        <div>
          <h3>Roommate Groups</h3>
          <p>Manage created groups, pending join requests, invitations, and shared applications.</p>
        </div>
      </div>

      {state.error ? <p className="error-text manager-flash-text">{state.error}</p> : null}
      {state.loading ? <div className="manager-empty-state"><h3>Loading roommate groups...</h3></div> : null}

      {!state.loading ? (
        <div className="roommate-dashboard-grid">
          <div className="roommate-dashboard-column">
            <h4>My created roommate groups</h4>
            {!state.createdGroups.length ? <p className="roommate-muted">No created groups yet.</p> : null}
            {state.createdGroups.map((group) => (
              <GroupMiniCard key={group._id} group={group}>
                <span className="roommate-state-label">{group.joinRequests?.filter((item) => item.status === 'pending').length || 0} pending request(s)</span>
              </GroupMiniCard>
            ))}
          </div>

          <div className="roommate-dashboard-column">
            <h4>Pending applicants</h4>
            {state.createdGroups.flatMap((group) => (group.joinRequests || []).filter((request) => request.status === 'pending').map((request) => ({ request, group }))).length === 0 ? (
              <p className="roommate-muted">No pending applicants right now.</p>
            ) : null}
            {state.createdGroups.flatMap((group) => (group.joinRequests || []).filter((request) => request.status === 'pending').map((request) => (
              <JoinRequestReviewCard key={request._id} request={request} onUpdated={fetchMine} />
            )))}
          </div>

          <div className="roommate-dashboard-column">
            <h4>Groups I joined</h4>
            {!state.memberGroups.length ? <p className="roommate-muted">You have not joined another group yet.</p> : null}
            {state.memberGroups.map((group) => <GroupMiniCard key={group._id} group={group} />)}

            <h4>Invitations waiting for me</h4>
            {!state.invitations.length ? <p className="roommate-muted">No pending invitations.</p> : null}
            {state.invitations.map((invitation) => (
              <article key={invitation._id} className="roommate-mini-card">
                <h4>{invitation.group?.property?.title || 'Roommate invitation'}</h4>
                <p>{invitation.group?.creator?.name || 'A tenant'} invited you to join this shared application.</p>
                <div className="request-action-row">
                  <button type="button" className="primary-btn" onClick={() => respondInvitation(invitation._id, 'accept')}>Accept</button>
                  <button type="button" className="secondary-btn" onClick={() => respondInvitation(invitation._id, 'decline')}>Decline</button>
                </div>
              </article>
            ))}
          </div>

          <div className="roommate-dashboard-column">
            <h4>Join requests I sent</h4>
            {!state.sentJoinRequests.length ? <p className="roommate-muted">No join requests sent yet.</p> : null}
            {state.sentJoinRequests.map((request) => (
              <article key={request._id} className="roommate-mini-card">
                <h4>{request.group?.property?.title || 'Roommate group'}</h4>
                <p>Host: {request.group?.creator?.name || 'Tenant'}</p>
                <span className={`manager-status-badge status-${request.status}`}>{request.status}</span>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
