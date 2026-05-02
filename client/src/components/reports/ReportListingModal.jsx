import { useState } from 'react'
import { api } from '../../lib/api'

const REPORT_REASONS = [
  { value: 'fake_listing', label: 'Fake listing' },
  { value: 'wrong_rent', label: 'Wrong rent' },
  { value: 'wrong_location', label: 'Wrong location' },
  { value: 'wrong_property_information', label: 'Wrong property information' },
  { value: 'misleading_photos', label: 'Misleading photos' },
  { value: 'property_already_rented', label: 'Property already rented' },
  { value: 'duplicate_listing', label: 'Duplicate listing' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'suspicious_manager', label: 'Suspicious manager' },
  { value: 'other', label: 'Other' }
]

export default function ReportListingModal({ property, onClose }) {
  const [form, setForm] = useState({ reason: '', comment: '' })
  const [state, setState] = useState({ loading: false, error: '', success: '' })

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!property?._id) return

    try {
      setState({ loading: true, error: '', success: '' })
      const { data } = await api.post('/property-reports', {
        propertyId: property._id,
        reason: form.reason,
        comment: form.comment
      })
      setState({
        loading: false,
        error: '',
        success: data.message || 'Your report has been submitted to the admin team. You will be notified if an admin replies.'
      })
      setForm({ reason: '', comment: '' })
    } catch (error) {
      setState({
        loading: false,
        error: error.response?.data?.message || 'Failed to submit report.',
        success: ''
      })
    }
  }

  return (
    <div className="report-modal-backdrop" role="dialog" aria-modal="true">
      <div className="report-modal-card">
        <div className="report-modal-header">
          <div>
            <p className="badge">Trust & Safety</p>
            <h2>Report This Listing</h2>
            <p>Tell the admin team what seems wrong with {property?.title || 'this listing'}.</p>
          </div>
          <button type="button" className="report-modal-close" onClick={onClose} aria-label="Close report modal">×</button>
        </div>

        {state.success ? (
          <div className="report-success-box">
            <strong>Report submitted</strong>
            <p>{state.success}</p>
            <button type="button" className="primary-btn" onClick={onClose}>Done</button>
          </div>
        ) : (
          <form className="report-form" onSubmit={handleSubmit}>
            <label>
              Why are you reporting this property?
              <select name="reason" value={form.reason} onChange={handleChange} required>
                <option value="">Select a reason</option>
                {REPORT_REASONS.map((reason) => (
                  <option key={reason.value} value={reason.value}>{reason.label}</option>
                ))}
              </select>
            </label>

            <label>
              Additional details
              <textarea
                name="comment"
                value={form.comment}
                onChange={handleChange}
                rows="5"
                maxLength="2000"
                placeholder="Explain what seems wrong or suspicious about this listing."
              />
            </label>

            {state.error ? <p className="error-text">{state.error}</p> : null}
            <p className="muted-text">Reports are sent only to admins. The property manager will not receive this report notification.</p>

            <div className="report-modal-actions">
              <button type="button" className="secondary-btn" onClick={onClose} disabled={state.loading}>Cancel</button>
              <button type="submit" className="primary-btn" disabled={state.loading}>{state.loading ? 'Submitting...' : 'Submit Report'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
