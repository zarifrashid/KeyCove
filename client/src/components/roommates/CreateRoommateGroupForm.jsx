import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'

function formatMoney(value, suffix = '') {
  const amount = `৳ ${Number(value || 0).toLocaleString()}`
  return suffix ? `${amount} ${suffix}` : amount
}

export default function CreateRoommateGroupForm({ property, actionType, leaseMonths, onCreated, onCancel }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    targetGroupSize: 2,
    leaseMonths: leaseMonths || '12',
    moveInDate: '',
    preferredGender: '',
    preferredOccupation: '',
    budgetPerPerson: '',
    cleanlinessPreference: '',
    smokingPreference: '',
    petPreference: '',
    lifestylePreference: '',
    introMessage: '',
    messageToManager: ''
  })
  const [state, setState] = useState({ submitting: false, error: '', success: '' })

  const monthlyRent = Number(property?.rentPrice || property?.price || 0)
  const rentPerPerson = useMemo(() => Math.ceil(monthlyRent / Number(form.targetGroupSize || 1)), [monthlyRent, form.targetGroupSize])

  const updateField = (field, value) => setForm((previous) => ({ ...previous, [field]: value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      setState({ submitting: true, error: '', success: '' })
      const { data } = await api.post('/roommate-groups', {
        propertyId: property._id,
        actionType,
        applicationMode: 'unknown_roommate_search',
        targetGroupSize: Number(form.targetGroupSize),
        leaseMonths: actionType === 'lease' ? Number(form.leaseMonths) : undefined,
        moveInDate: form.moveInDate || undefined,
        introMessage: form.introMessage,
        messageToManager: form.messageToManager,
        preferences: {
          preferredGender: form.preferredGender,
          preferredOccupation: form.preferredOccupation,
          smokingPreference: form.smokingPreference,
          petPreference: form.petPreference,
          cleanlinessPreference: form.cleanlinessPreference,
          lifestylePreference: form.lifestylePreference
        }
      })
      setState({ submitting: false, error: '', success: 'Your roommate group has been created.' })
      onCreated?.(data.group)
      setTimeout(() => navigate(`/roommate-groups/${data.group?._id}`), 700)
    } catch (error) {
      setState({ submitting: false, error: error.response?.data?.message || 'Failed to create roommate group.', success: '' })
    }
  }

  return (
    <form className="roommate-flow-card" onSubmit={handleSubmit}>
      <div className="roommate-section-header">
        <div>
          <p className="badge">Start New Group</p>
          <h2>Create a roommate search group</h2>
          <p>Other tenants viewing this property can apply to join. You approve who joins before anything goes to the manager.</p>
        </div>
        <button type="button" className="secondary-btn" onClick={onCancel}>Cancel</button>
      </div>

      {state.error ? <p className="error-text">{state.error}</p> : null}
      {state.success ? <p className="success-text">{state.success}</p> : null}

      <div className="roommate-form-grid">
        <label className="property-field"><span>Total group size including me</span><input type="number" min="2" value={form.targetGroupSize} onChange={(event) => updateField('targetGroupSize', event.target.value)} required /></label>
        {actionType === 'lease' ? <label className="property-field"><span>Lease months</span><input type="number" min="1" value={form.leaseMonths} onChange={(event) => updateField('leaseMonths', event.target.value)} required /></label> : null}
        <label className="property-field"><span>Move-in date</span><input type="date" value={form.moveInDate} onChange={(event) => updateField('moveInDate', event.target.value)} /></label>
        <label className="property-field"><span>Budget per person</span><input type="number" min="0" value={form.budgetPerPerson} onChange={(event) => updateField('budgetPerPerson', event.target.value)} placeholder={String(rentPerPerson)} /></label>
      </div>

      <div className="roommate-rent-pill roommate-rent-pill--wide">
        <span>Estimated split from property rent</span>
        <strong>{formatMoney(rentPerPerson, '/ month')}</strong>
      </div>

      <div className="roommate-form-grid">
        <label className="property-field"><span>Preferred gender</span><input value={form.preferredGender} onChange={(event) => updateField('preferredGender', event.target.value)} placeholder="Any / Male / Female" /></label>
        <label className="property-field"><span>Preferred occupation</span><input value={form.preferredOccupation} onChange={(event) => updateField('preferredOccupation', event.target.value)} placeholder="Students, professionals" /></label>
        <label className="property-field"><span>Cleanliness preference</span><input value={form.cleanlinessPreference} onChange={(event) => updateField('cleanlinessPreference', event.target.value)} /></label>
        <label className="property-field"><span>Smoking preference</span><input value={form.smokingPreference} onChange={(event) => updateField('smokingPreference', event.target.value)} /></label>
        <label className="property-field"><span>Pet preference</span><input value={form.petPreference} onChange={(event) => updateField('petPreference', event.target.value)} /></label>
        <label className="property-field"><span>Lifestyle preference</span><input value={form.lifestylePreference} onChange={(event) => updateField('lifestylePreference', event.target.value)} placeholder="Quiet, social, study-focused" /></label>
      </div>

      <label className="property-field full-width"><span>Short introduction</span><textarea rows="3" value={form.introMessage} onChange={(event) => updateField('introMessage', event.target.value)} required placeholder="I am alone right now and need roommates..." /></label>
      <label className="property-field full-width"><span>Message to manager (optional)</span><textarea rows="3" value={form.messageToManager} onChange={(event) => updateField('messageToManager', event.target.value)} /></label>

      <div className="property-action-buttons">
        <button type="submit" className="primary-btn" disabled={state.submitting}>{state.submitting ? 'Creating...' : 'Create Roommate Group'}</button>
      </div>
    </form>
  )
}
