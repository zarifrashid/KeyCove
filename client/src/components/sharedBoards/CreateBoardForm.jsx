import { useState } from 'react'

export default function CreateBoardForm({ onSubmit, property, submitLabel = 'Create Board' }) {
  const [form, setForm] = useState({
    title: property ? `${property.title} shortlist` : '',
    description: property ? `Shared search board for comparing ${property.title} with other options.` : '',
    addCurrentProperty: Boolean(property)
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.title.trim()) {
      setError('Please enter a board title.')
      return
    }

    try {
      setBusy(true)
      setError('')
      await onSubmit({
        title: form.title.trim(),
        description: form.description.trim(),
        addCurrentProperty: form.addCurrentProperty
      })
      setForm({ title: '', description: '', addCurrentProperty: Boolean(property) })
    } catch (submitError) {
      setError(submitError?.response?.data?.message || submitError?.message || 'Unable to create board.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="shared-board-form" onSubmit={handleSubmit}>
      <label>
        Board Title
        <input name="title" value={form.title} onChange={handleChange} placeholder="Weekend apartment shortlist" />
      </label>
      <label>
        Description
        <textarea name="description" value={form.description} onChange={handleChange} rows="3" placeholder="Add a short note so members understand the goal of this board." />
      </label>
      {property ? (
        <label className="shared-board-checkbox-row">
          <input type="checkbox" name="addCurrentProperty" checked={form.addCurrentProperty} onChange={handleChange} />
          <span>Add this property to the new board immediately</span>
        </label>
      ) : null}
      {error ? <p className="error-text">{error}</p> : null}
      <button type="submit" className="primary-btn" disabled={busy}>{busy ? 'Saving...' : submitLabel}</button>
    </form>
  )
}
