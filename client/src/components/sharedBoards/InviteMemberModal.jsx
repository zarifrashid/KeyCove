import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

export default function InviteMemberModal({ boardId, onClose, onInvited }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [busyId, setBusyId] = useState('')
  const [status, setStatus] = useState({ loading: false, error: '' })

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return undefined
    }

    const timeout = setTimeout(async () => {
      try {
        setStatus({ loading: true, error: '' })
        const { data } = await api.get(`/boards/users/search?q=${encodeURIComponent(query.trim())}`)
        setResults(data.users || [])
        setStatus({ loading: false, error: '' })
      } catch (error) {
        setStatus({ loading: false, error: error.response?.data?.message || 'Unable to search tenants.' })
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [query])

  const handleInvite = async (userId) => {
    try {
      setBusyId(userId)
      setStatus({ loading: false, error: '' })
      await api.post(`/boards/${boardId}/invite`, { userId })
      onInvited()
      onClose()
    } catch (error) {
      setStatus({ loading: false, error: error.response?.data?.message || 'Unable to send invitation.' })
    } finally {
      setBusyId('')
    }
  }

  return (
    <div className="shared-board-modal-backdrop" role="dialog" aria-modal="true">
      <div className="shared-board-modal-card invite-modal">
        <div className="shared-board-modal-header">
          <div>
            <p className="badge">Invite Member</p>
            <h2>Invite tenants to this shared board</h2>
            <p>This uses the same user-to-user authenticated logic style as your current chat system.</p>
          </div>
          <button type="button" className="shared-board-modal-close" onClick={onClose}>✕</button>
        </div>

        <label>
          Search by tenant name or email
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. nusrat or nusrat@email.com" />
        </label>

        {status.error ? <p className="error-text">{status.error}</p> : null}
        {status.loading ? <p>Searching tenants...</p> : null}

        <div className="shared-board-search-results">
          {results.map((user) => (
            <article key={user._id} className="shared-board-user-result">
              <div>
                <strong>{user.name}</strong>
                <p>{user.email}</p>
              </div>
              <button type="button" className="primary-btn" onClick={() => handleInvite(user._id)} disabled={busyId === user._id}>
                {busyId === user._id ? 'Inviting...' : 'Invite'}
              </button>
            </article>
          ))}
          {!status.loading && query.trim().length >= 2 && !results.length ? <p className="muted-text">No matching tenants found.</p> : null}
        </div>
      </div>
    </div>
  )
}
