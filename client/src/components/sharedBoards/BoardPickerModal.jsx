import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import CreateBoardForm from './CreateBoardForm'

export default function BoardPickerModal({ property, onClose }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('add')
  const [boards, setBoards] = useState([])
  const [selectedBoardId, setSelectedBoardId] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [boardNote, setBoardNote] = useState('')

  const loadBoards = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/boards')
      setBoards(data.boards || [])
      setSelectedBoardId((current) => current || data.boards?.[0]?._id || '')
      setError('')
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Unable to load your shared boards.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBoards()
  }, [])

  const selectedBoard = useMemo(() => boards.find((board) => board._id === selectedBoardId) || null, [boards, selectedBoardId])

  const handleAddToBoard = async () => {
    if (!selectedBoardId) {
      setError('Choose a board first.')
      return
    }

    try {
      setBusy(true)
      setError('')
      await api.post(`/boards/${selectedBoardId}/items`, {
        propertyId: property._id,
        note: boardNote
      })
      setSuccessMessage('Property added to shared board successfully.')
      setBoardNote('')
      await loadBoards()
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Unable to add property to the selected board.')
    } finally {
      setBusy(false)
    }
  }

  const handleCreateBoard = async ({ title, description, addCurrentProperty }) => {
    const { data } = await api.post('/boards', {
      title,
      description,
      addPropertyId: addCurrentProperty ? property._id : undefined
    })

    setSuccessMessage('Shared board created successfully.')
    await loadBoards()
    navigate(`/shared-boards/${data.board._id}`)
    onClose()
  }

  return (
    <div className="shared-board-modal-backdrop" role="dialog" aria-modal="true">
      <div className="shared-board-modal-card">
        <div className="shared-board-modal-header">
          <div>
            <p className="badge">Shared Search</p>
            <h2>Add “{property?.title}” to a collaborative board</h2>
            <p>Keep the current property experience unchanged while giving tenants a group decision workflow.</p>
          </div>
          <button type="button" className="shared-board-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="shared-board-tab-row compact">
          <button type="button" className={`shared-board-tab-btn ${activeTab === 'add' ? 'active' : ''}`} onClick={() => setActiveTab('add')}>Add to Board</button>
          <button type="button" className={`shared-board-tab-btn ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}>Create New Board</button>
        </div>

        {error ? <p className="error-text">{error}</p> : null}
        {successMessage ? <p className="success-text">{successMessage}</p> : null}

        {activeTab === 'add' ? (
          <div className="shared-board-modal-grid">
            <section className="shared-board-modal-column">
              <h3>Your Boards</h3>
              {loading ? <p>Loading boards...</p> : null}
              {!loading && !boards.length ? <p className="muted-text">No shared boards yet. Create one in the next tab.</p> : null}
              <div className="shared-board-select-list">
                {boards.map((board) => (
                  <button
                    type="button"
                    key={board._id}
                    className={`shared-board-select-card ${selectedBoardId === board._id ? 'active' : ''}`}
                    onClick={() => setSelectedBoardId(board._id)}
                  >
                    <strong>{board.title}</strong>
                    <span>{board.propertyCount || 0} properties · {board.memberCount || 0} members</span>
                    <small>{board.description || 'No description added yet.'}</small>
                  </button>
                ))}
              </div>
            </section>

            <section className="shared-board-modal-column">
              <h3>Selection</h3>
              {selectedBoard ? (
                <div className="shared-board-selection-panel">
                  <strong>{selectedBoard.title}</strong>
                  <p>{selectedBoard.description || 'No board description was provided.'}</p>
                  <label>
                    Optional Note
                    <textarea
                      rows="4"
                      value={boardNote}
                      onChange={(event) => setBoardNote(event.target.value)}
                      placeholder="Add a quick group note like budget fit, good area, or commute concerns."
                    />
                  </label>
                  <div className="shared-board-selection-actions">
                    <button type="button" className="primary-btn" onClick={handleAddToBoard} disabled={busy}>{busy ? 'Adding...' : 'Add This Property'}</button>
                    <button type="button" className="secondary-btn" onClick={() => navigate(`/shared-boards/${selectedBoard._id}`)}>Open Board</button>
                  </div>
                </div>
              ) : (
                <p className="muted-text">Choose a board from the left side first.</p>
              )}
            </section>
          </div>
        ) : (
          <CreateBoardForm property={property} onSubmit={handleCreateBoard} submitLabel="Create Shared Board" />
        )}
      </div>
    </div>
  )
}
