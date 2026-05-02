import { useState } from 'react'
import { api } from '../../lib/api'

export default function JoinRoommateGroupModal({ group, onClose, onSubmitted }) {
  const [form, setForm] = useState({
    phone: '',
    occupation: '',
    monthlyIncome: '',
    employmentStatus: '',
    employerName: '',
    currentAddress: '',
    introMessage: '',
    lifestyleNote: '',
    expectedContribution: group?.rentPerPerson || ''
  })
  const [state, setState] = useState({ submitting: false, error: '', success: '' })

  const updateField = (field, value) => setForm((previous) => ({ ...previous, [field]: value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      setState({ submitting: true, error: '', success: '' })
      await api.post(`/roommate-groups/${group._id}/join-requests`, {
        ...form,
        monthlyIncome: form.monthlyIncome === '' ? undefined : Number(form.monthlyIncome),
        expectedContribution: form.expectedContribution === '' ? undefined : Number(form.expectedContribution)
      })
      setState({ submitting: false, error: '', success: 'Your request was sent to the group creator. You will be notified when they accept or reject it.' })
      onSubmitted?.()
      setTimeout(() => onClose?.(), 900)
    } catch (error) {
      setState({ submitting: false, error: error.response?.data?.message || 'Failed to send join request.', success: '' })
    }
  }

  if (!group) return null

  return (
    <div className="roommate-modal-backdrop">
      <form className="roommate-modal" onSubmit={handleSubmit}>
        <div className="roommate-section-header">
          <div>
            <p className="badge">Apply to Join This Group</p>
            <h2>{group.property?.title || 'Roommate Group'}</h2>
            <p>Your request will be sent to {group.creator?.name || 'the host'} for approval.</p>
          </div>
          <button type="button" className="secondary-btn" onClick={onClose}>Close</button>
        </div>

        {state.error ? <p className="error-text">{state.error}</p> : null}
        {state.success ? <p className="success-text">{state.success}</p> : null}

        <div className="roommate-form-grid">
          <label className="property-field"><span>Phone</span><input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} required /></label>
          <label className="property-field"><span>Occupation</span><input value={form.occupation} onChange={(event) => updateField('occupation', event.target.value)} required /></label>
          <label className="property-field"><span>Monthly income</span><input type="number" min="0" value={form.monthlyIncome} onChange={(event) => updateField('monthlyIncome', event.target.value)} /></label>
          <label className="property-field"><span>Employment/student status</span><input value={form.employmentStatus} onChange={(event) => updateField('employmentStatus', event.target.value)} required /></label>
          <label className="property-field"><span>Employer / institute</span><input value={form.employerName} onChange={(event) => updateField('employerName', event.target.value)} /></label>
          <label className="property-field"><span>Expected contribution</span><input type="number" min="0" value={form.expectedContribution} onChange={(event) => updateField('expectedContribution', event.target.value)} /></label>
        </div>

        <label className="property-field full-width"><span>Current address</span><input value={form.currentAddress} onChange={(event) => updateField('currentAddress', event.target.value)} /></label>
        <label className="property-field full-width"><span>Short introduction</span><textarea rows="3" value={form.introMessage} onChange={(event) => updateField('introMessage', event.target.value)} required /></label>
        <label className="property-field full-width"><span>Why do you want to join this group?</span><textarea rows="3" value={form.lifestyleNote} onChange={(event) => updateField('lifestyleNote', event.target.value)} /></label>

        <div className="property-action-buttons">
          <button type="submit" className="primary-btn" disabled={state.submitting}>{state.submitting ? 'Sending...' : 'Send Join Request'}</button>
        </div>
      </form>
    </div>
  )
}
