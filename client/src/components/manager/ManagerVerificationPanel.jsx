import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

const INITIAL_FORM = {
  companyName: '',
  businessEmail: '',
  businessPhone: '',
  licenseNumber: '',
  businessAddress: '',
  city: 'Dhaka',
  state: '',
  country: 'Bangladesh',
  yearsOfExperience: '',
  documentType: 'trade_license',
  documentUrl: '',
  verificationMessage: ''
}

function getStatusText(status) {
  if (status === 'verified') return 'Verified'
  if (status === 'pending') return 'Pending admin review'
  if (status === 'rejected') return 'Rejected - please resubmit'
  return 'Not submitted'
}

export default function ManagerVerificationPanel() {
  const { user, setUser } = useAuth()
  const [verification, setVerification] = useState(null)
  const [form, setForm] = useState({ ...INITIAL_FORM, companyName: user?.companyName || '', businessEmail: user?.email || '', businessPhone: user?.phone || '' })
  const [state, setState] = useState({ loading: true, submitting: false, error: '', message: '' })

  useEffect(() => {
    if (user?.role !== 'manager') return

    const fetchVerification = async () => {
      try {
        setState((previous) => ({ ...previous, loading: true, error: '' }))
        const { data } = await api.get('/manager-verifications/me')
        setVerification(data.verification || null)
        setState((previous) => ({ ...previous, loading: false }))
      } catch (error) {
        setState((previous) => ({
          ...previous,
          loading: false,
          error: error.response?.data?.message || 'Failed to load verification status.'
        }))
      }
    }

    fetchVerification()
  }, [user?.role])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setState({ loading: false, submitting: true, error: '', message: '' })
      const { data } = await api.post('/manager-verifications/submit', form)
      setVerification(data.verification)
      const nextUser = {
        ...user,
        companyName: form.companyName,
        isManagerVerified: false,
        managerVerificationStatus: 'pending'
      }
      setUser(nextUser)
      localStorage.setItem('keycoveUser', JSON.stringify(nextUser))
      setState({ loading: false, submitting: false, error: '', message: data.message || 'Verification submitted.' })
    } catch (error) {
      setState({
        loading: false,
        submitting: false,
        error: error.response?.data?.message || 'Failed to submit verification request.',
        message: ''
      })
    }
  }

  const status = verification?.status || user?.managerVerificationStatus || 'not_submitted'
  const canSubmit = !verification || verification.status === 'rejected'

  return (
    <section className="card manager-verification-card">
      <div className="manager-list-header">
        <div>
          <p className="badge">Manager Verification</p>
          <h3>Verification Status: {getStatusText(status)}</h3>
          <p>Submit your business and document details so an admin can verify your manager account.</p>
        </div>
        <span className={`admin-status-pill status-${status}`}>{getStatusText(status)}</span>
      </div>

      {state.loading ? <p>Loading verification status...</p> : null}
      {state.error ? <p className="error-text">{state.error}</p> : null}
      {state.message ? <p className="success-text">{state.message}</p> : null}

      {verification ? (
        <div className="verification-summary-grid">
          <div><strong>Company:</strong> {verification.companyName}</div>
          <div><strong>Document Type:</strong> {verification.documentType}</div>
          <div><strong>License:</strong> {verification.licenseNumber || 'Not provided'}</div>
          <div><strong>Submitted:</strong> {new Date(verification.createdAt).toLocaleDateString()}</div>
          {verification.adminNote ? <div className="verification-summary-wide"><strong>Admin Note:</strong> {verification.adminNote}</div> : null}
          {verification.documentUrl ? (
            <div className="verification-summary-wide">
              <strong>Document:</strong> <a href={verification.documentUrl} target="_blank" rel="noreferrer">Open document</a>
            </div>
          ) : null}
        </div>
      ) : null}

      {canSubmit ? (
        <form className="manager-verification-form" onSubmit={handleSubmit}>
          <div className="form-grid two-col-form-grid">
            <label>
              Company Name
              <input name="companyName" value={form.companyName} onChange={handleChange} required />
            </label>
            <label>
              Business Email
              <input name="businessEmail" type="email" value={form.businessEmail} onChange={handleChange} />
            </label>
            <label>
              Business Phone
              <input name="businessPhone" value={form.businessPhone} onChange={handleChange} />
            </label>
            <label>
              License Number
              <input name="licenseNumber" value={form.licenseNumber} onChange={handleChange} />
            </label>
            <label>
              Business Address
              <input name="businessAddress" value={form.businessAddress} onChange={handleChange} />
            </label>
            <label>
              City
              <input name="city" value={form.city} onChange={handleChange} />
            </label>
            <label>
              State / Division
              <input name="state" value={form.state} onChange={handleChange} />
            </label>
            <label>
              Country
              <input name="country" value={form.country} onChange={handleChange} />
            </label>
            <label>
              Years of Experience
              <input name="yearsOfExperience" type="number" min="0" value={form.yearsOfExperience} onChange={handleChange} />
            </label>
            <label>
              Document Type
              <select name="documentType" value={form.documentType} onChange={handleChange}>
                <option value="trade_license">Trade License</option>
                <option value="company_registration">Company Registration</option>
                <option value="broker_license">Broker License</option>
                <option value="nid">NID</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="verification-summary-wide">
              Document URL
              <input name="documentUrl" value={form.documentUrl} onChange={handleChange} placeholder="Paste a cloud/local document URL for review" required />
            </label>
            <label className="verification-summary-wide">
              Verification Message
              <textarea name="verificationMessage" rows="3" value={form.verificationMessage} onChange={handleChange} placeholder="Optional note for the admin" />
            </label>
          </div>

          <button type="submit" className="primary-btn" disabled={state.submitting}>
            {state.submitting ? 'Submitting...' : verification?.status === 'rejected' ? 'Resubmit Verification' : 'Submit Verification'}
          </button>
        </form>
      ) : null}
    </section>
  )
}
