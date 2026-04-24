import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { api } from '../lib/api'
import useBoardRealtime from '../hooks/useBoardRealtime'
import CreateBoardForm from '../components/sharedBoards/CreateBoardForm'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export default function SharedBoardsPage() {
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, error: '', boards: [], invitations: [], summary: { pendingInvites: 0, unreadActivity: 0 } })

  const loadPage = useCallback(async () => {
    try {
      setState((previous) => ({ ...previous, loading: true, error: '' }))
      const [{ data: boardsData }, { data: invitesData }, { data: summaryData }] = await Promise.all([
        api.get('/boards'),
        api.get('/boards/invitations/pending'),
        api.get('/boards/summary')
      ])

      setState({
        loading: false,
        error: '',
        boards: boardsData.boards || [],
        invitations: invitesData.invitations || [],
        summary: {
          pendingInvites: summaryData.pendingInvites || 0,
          unreadActivity: summaryData.unreadActivity || 0
        }
      })
    } catch (error) {
      setState((previous) => ({
        ...previous,
        loading: false,
        error: error.response?.data?.message || 'Unable to load shared boards.'
      }))
    }
  }, [])

  useEffect(() => {
    loadPage()
  }, [loadPage])

  useBoardRealtime({
    enabled: true,
    onEvent: (eventName) => {
      if (eventName === 'ping' || eventName === 'board:connected') return
      loadPage()
    }
  })

  const handleCreateBoard = async ({ title, description }) => {
    const { data } = await api.post('/boards', { title, description })
    await loadPage()
    navigate(`/shared-boards/${data.board._id}`)
  }

  const respondToInvite = async (memberId, response) => {
    try {
      await api.patch(`/boards/invitations/${memberId}/respond`, { response })
      await loadPage()
    } catch (error) {
      setState((previous) => ({
        ...previous,
        error: error.response?.data?.message || 'Unable to update invitation.'
      }))
    }
  }

  return (
    <>
      <Navbar />
      <div className="page-wrap shared-board-page-wrap">
        <div className="shared-board-page-grid">
          <section className="card shared-board-hero-card">
            <div>
              <p className="badge">Feature 11 · Collaborative Shared Searching</p>
              <h1>Shared Search Boards</h1>
              <p>Create a board, invite members, add properties from details pages, comment, vote, and keep group activity together without changing the rest of KeyCove.</p>
            </div>
            <div className="shared-board-stats-grid compact">
              <article className="shared-board-stat-card"><span>Boards</span><strong>{state.boards.length}</strong></article>
              <article className="shared-board-stat-card"><span>Pending Invites</span><strong>{state.summary.pendingInvites}</strong></article>
              <article className="shared-board-stat-card"><span>Unread Activity</span><strong>{state.summary.unreadActivity}</strong></article>
            </div>
          </section>

          <div className="shared-board-main-grid">
            <section className="card shared-board-tab-card">
              <div className="property-section-heading">
                <h2>Create New Board</h2>
                <p>Start a collaboration space without touching your current search or property flows.</p>
              </div>
              <CreateBoardForm onSubmit={handleCreateBoard} submitLabel="Create Board" />
            </section>

            <section className="card shared-board-tab-card">
              <div className="property-section-heading">
                <h2>Your Boards</h2>
                <p>Open any board to invite members, add more properties, comment, vote, and review activity.</p>
              </div>
              {state.loading ? <p>Loading shared boards...</p> : null}
              {state.error ? <p className="error-text">{state.error}</p> : null}
              <div className="shared-board-card-list">
                {state.boards.map((board) => (
                  <article key={board._id} className="shared-board-summary-card">
                    <div>
                      <strong>{board.title}</strong>
                      <p>{board.description || 'No description yet.'}</p>
                    </div>
                    <div className="shared-board-summary-meta">
                      <span>{board.propertyCount || 0} properties</span>
                      <span>{board.memberCount || 0} members</span>
                      <span>{board.unreadActivityCount || 0} unread</span>
                      <span>Updated {formatDate(board.lastActivityAt)}</span>
                    </div>
                    <div className="shared-board-summary-actions">
                      <button type="button" className="primary-btn" onClick={() => navigate(`/shared-boards/${board._id}`)}>Open Board</button>
                      {board.coverProperty?._id ? <Link to={`/properties/${board.coverProperty._id}`} className="secondary-btn">Open Cover Property</Link> : null}
                    </div>
                  </article>
                ))}
                {!state.loading && !state.boards.length ? <p className="muted-text">No boards yet. Create your first collaborative shared search board.</p> : null}
              </div>
            </section>
          </div>

          <section className="card shared-board-tab-card">
            <div className="property-section-heading">
              <h2>Pending Invitations</h2>
              <p>These invitations arrive using the same authenticated user flow pattern as your real-time chat module.</p>
            </div>
            <div className="shared-board-card-list">
              {state.invitations.map((invitation) => (
                <article key={invitation._id} className="shared-board-invite-card">
                  <div>
                    <strong>{invitation.board?.title || 'Shared board'}</strong>
                    <p>{invitation.board?.description || 'No description available.'}</p>
                    <span>Invited by {invitation.invitedBy?.name || invitation.board?.owner?.name || 'Board owner'} · {formatDate(invitation.invitedAt)}</span>
                  </div>
                  <div className="shared-board-summary-actions">
                    <button type="button" className="primary-btn" onClick={() => respondToInvite(invitation._id, 'accepted')}>Accept</button>
                    <button type="button" className="secondary-btn" onClick={() => respondToInvite(invitation._id, 'declined')}>Decline</button>
                  </div>
                </article>
              ))}
              {!state.invitations.length ? <p className="muted-text">No pending invitations right now.</p> : null}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
