import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { buildDefaultChecklist, makeEmptyDecisionNote, VISIT_STATUS_OPTIONS } from '../../lib/decisionHub'
import DecisionTagSelector from './DecisionTagSelector'
import VisitChecklist from './VisitChecklist'

function normalizeNote(propertyId, note = {}) {
  return {
    ...makeEmptyDecisionNote(propertyId),
    ...note,
    personalRating: note.personalRating || '',
    checklist: buildDefaultChecklist(note.checklist),
    decisionTags: Array.isArray(note.decisionTags) ? note.decisionTags : []
  }
}

export default function DecisionNotePanel({ propertyId, initialNote = null, onSaved, compact = false }) {
  const [note, setNote] = useState(() => normalizeNote(propertyId, initialNote || {}))
  const [loading, setLoading] = useState(!initialNote)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadNote = async () => {
      if (!propertyId) return
      if (initialNote) {
        setNote(normalizeNote(propertyId, initialNote))
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const { data } = await api.get(`/decision-hub/${propertyId}`)
        if (!cancelled) setNote(normalizeNote(propertyId, data.note))
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Decision notes are not available yet.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadNote()
    return () => {
      cancelled = true
    }
  }, [propertyId, initialNote])

  const updateField = (field, value) => setNote((previous) => ({ ...previous, [field]: value }))

  const saveNote = async (overrides = {}) => {
    if (!propertyId) return null
    const nextNote = { ...note, ...overrides }
    const payload = {
      visitStatus: nextNote.visitStatus || 'not_visited',
      personalRating: nextNote.personalRating ? Number(nextNote.personalRating) : null,
      pros: nextNote.pros || '',
      cons: nextNote.cons || '',
      questionsForManager: nextNote.questionsForManager || '',
      privateNotes: nextNote.privateNotes || '',
      checklist: buildDefaultChecklist(nextNote.checklist),
      decisionTags: Array.isArray(nextNote.decisionTags) ? nextNote.decisionTags : [],
      compareSelected: Boolean(nextNote.compareSelected)
    }

    try {
      setSaving(true)
      setError('')
      setMessage('')
      const { data } = await api.post(`/decision-hub/${propertyId}`, payload)
      const saved = normalizeNote(propertyId, data.note)
      setNote(saved)
      setMessage(data.message || 'Decision note saved.')
      onSaved?.(saved)
      return saved
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save decision note.')
      return null
    } finally {
      setSaving(false)
    }
  }

  const toggleCompare = async () => {
    try {
      setSaving(true)
      setError('')
      setMessage('')
      const next = !note.compareSelected
      const { data } = await api.patch(`/decision-hub/${propertyId}/compare`, { compareSelected: next })
      const saved = normalizeNote(propertyId, data.note)
      setNote(saved)
      setMessage(data.message || (next ? 'Added to comparison.' : 'Removed from comparison.'))
      onSaved?.(saved)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update comparison selection.')
    } finally {
      setSaving(false)
    }
  }

  const markFinalChoice = () => saveNote({
    visitStatus: 'final_choice',
    decisionTags: [...new Set([...(note.decisionTags || []).filter((tag) => tag !== 'rejected'), 'final_choice'])]
  })

  const rejectProperty = () => saveNote({
    visitStatus: 'rejected',
    compareSelected: false,
    decisionTags: [...new Set([...(note.decisionTags || []).filter((tag) => tag !== 'final_choice'), 'rejected'])]
  })

  if (loading) return <div className="decision-note-panel loading">Loading decision notes...</div>

  return (
    <div className={`decision-note-panel ${compact ? 'compact' : ''}`}>
      <div className="decision-panel-head">
        <div>
          <p className="decision-eyebrow">Private Tenant Workspace</p>
          <h3>Visit Checklist & Decision Notes</h3>
        </div>
        <button type="button" className="secondary-btn" onClick={toggleCompare} disabled={saving}>
          {note.compareSelected ? 'Remove from Compare' : 'Add to Compare'}
        </button>
      </div>

      {message ? <p className="success-text">{message}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <div className="decision-form-grid">
        <label>
          Visit Status
          <select value={note.visitStatus || 'not_visited'} onChange={(event) => updateField('visitStatus', event.target.value)}>
            {VISIT_STATUS_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
        </label>
        <label>
          Personal Rating
          <select value={note.personalRating || ''} onChange={(event) => updateField('personalRating', event.target.value)}>
            <option value="">No rating yet</option>
            {[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating} ★</option>)}
          </select>
        </label>
      </div>

      <div className="decision-form-grid two">
        <label>
          Pros
          <textarea value={note.pros || ''} onChange={(event) => updateField('pros', event.target.value)} placeholder="What did you like?" />
        </label>
        <label>
          Cons
          <textarea value={note.cons || ''} onChange={(event) => updateField('cons', event.target.value)} placeholder="Any concern or compromise?" />
        </label>
      </div>

      <label className="decision-full-field">
        Questions for Manager
        <textarea value={note.questionsForManager || ''} onChange={(event) => updateField('questionsForManager', event.target.value)} placeholder="Write questions before contacting the manager..." />
      </label>

      <label className="decision-full-field">
        Private Notes
        <textarea value={note.privateNotes || ''} onChange={(event) => updateField('privateNotes', event.target.value)} placeholder="Only you can see these notes." />
      </label>

      <div className="decision-subsection">
        <strong>Decision Tags</strong>
        <DecisionTagSelector value={note.decisionTags} onChange={(tags) => updateField('decisionTags', tags)} />
      </div>

      <div className="decision-subsection">
        <strong>Inspection Checklist</strong>
        <VisitChecklist checklist={note.checklist} onChange={(items) => updateField('checklist', items)} />
      </div>

      <div className="decision-actions-row">
        <button type="button" className="primary-btn" onClick={() => saveNote()} disabled={saving}>{saving ? 'Saving...' : 'Save Notes'}</button>
        <button type="button" className="secondary-btn" onClick={markFinalChoice} disabled={saving}>Mark Final Choice</button>
        <button type="button" className="secondary-btn danger-btn" onClick={rejectProperty} disabled={saving}>Reject Property</button>
      </div>
    </div>
  )
}
