import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { api } from '../lib/api'
import useBoardRealtime from '../hooks/useBoardRealtime'
import BoardHeader from '../components/sharedBoards/BoardHeader'
import BoardTabs from '../components/sharedBoards/BoardTabs'
import BoardItemsTab from '../components/sharedBoards/BoardItemsTab'
import BoardMembersTab from '../components/sharedBoards/BoardMembersTab'
import BoardActivityTab from '../components/sharedBoards/BoardActivityTab'
import InviteMemberModal from '../components/sharedBoards/InviteMemberModal'
import { useAuth } from '../context/AuthContext'

export default function SharedBoardDetailsPage() {
  const { boardId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('properties')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [state, setState] = useState({ loading: true, error: '', board: null, acceptedMembers: [], pendingMembers: [], items: [], notifications: [], members: [] })

  const loadBoard = useCallback(async () => {
    try {
      setState((previous) => ({ ...previous, loading: true, error: '' }))
      const { data } = await api.get(`/boards/${boardId}`)
      setState({
        loading: false,
        error: '',
        board: data.board,
        acceptedMembers: data.acceptedMembers || [],
        pendingMembers: data.pendingMembers || [],
        members: data.members || [],
        items: data.items || [],
        notifications: data.notifications || []
      })
    } catch (error) {
      setState((previous) => ({
        ...previous,
        loading: false,
        error: error.response?.data?.message || 'Unable to load this board.'
      }))
    }
  }, [boardId])

  useEffect(() => {
    loadBoard()
  }, [loadBoard])

  useBoardRealtime({
    enabled: true,
    onEvent: (eventName, payload) => {
      if (eventName === 'ping' || eventName === 'board:connected') return
      if (payload?.boardId && payload.boardId !== boardId) return
      loadBoard()
    }
  })

  const isOwner = useMemo(() => {
    return String(state.board?.owner?._id || '') === String(user?.id || '')
  }, [state.board?.owner?._id, user?.id])

  const runBoardAction = async (request) => {
    try {
      setBusy(true)
      await request()
      await loadBoard()
    } catch (error) {
      setState((previous) => ({
        ...previous,
        error: error.response?.data?.message || 'Unable to update the board.'
      }))
    } finally {
      setBusy(false)
    }
  }

  const handleVote = (itemId, voteType) => runBoardAction(() => api.post(`/boards/items/${itemId}/vote`, { voteType }))
  const handleComment = (itemId, text) => runBoardAction(() => api.post(`/boards/items/${itemId}/comments`, { text }))
  const handleRemove = (itemId) => {
    if (!window.confirm('Remove this property from the board?')) return Promise.resolve()
    return runBoardAction(() => api.delete(`/boards/${boardId}/items/${itemId}`))
  }

  const handleLeaveBoard = async () => {
    if (!window.confirm('Leave this shared board?')) return

    try {
      setBusy(true)
      await api.delete(`/boards/${boardId}/members/me`)
      navigate('/shared-boards')
    } catch (error) {
      setState((previous) => ({
        ...previous,
        error: error.response?.data?.message || 'Unable to leave the board.'
      }))
      setBusy(false)
    }
  }

  const handleMarkAllRead = () => runBoardAction(() => api.patch(`/boards/${boardId}/notifications/read-all`))

  return (
    <>
      <Navbar />
      <div className="page-wrap shared-board-page-wrap">
        <div className="shared-board-page-grid single-board">
          {state.loading ? <div className="card shared-board-tab-card"><p>Loading board...</p></div> : null}
          {state.error ? <div className="card shared-board-tab-card"><p className="error-text">{state.error}</p></div> : null}

          {state.board ? (
            <>
              <BoardHeader
                board={state.board}
                canInvite={isOwner}
                onInvite={() => setShowInviteModal(true)}
                onLeave={handleLeaveBoard}
              />

              <BoardTabs activeTab={activeTab} onChange={setActiveTab} />

              {activeTab === 'properties' ? (
                <BoardItemsTab items={state.items} onVote={handleVote} onComment={handleComment} onRemove={handleRemove} busy={busy} />
              ) : null}

              {activeTab === 'members' ? (
                <BoardMembersTab acceptedMembers={state.acceptedMembers} pendingMembers={state.pendingMembers} />
              ) : null}

              {activeTab === 'activity' ? (
                <BoardActivityTab notifications={state.notifications} onMarkAllRead={handleMarkAllRead} busy={busy} />
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      {showInviteModal ? <InviteMemberModal boardId={boardId} onClose={() => setShowInviteModal(false)} onInvited={loadBoard} /> : null}
    </>
  )
}
