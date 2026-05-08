import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SignupPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'tenant',
    phone: '',
    companyName: ''
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [resending, setResending] = useState(false)
  const [devVerificationUrl, setDevVerificationUrl] = useState('')
  const { register, resendVerification } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const preventZoomWheel = (event) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault()
      }
    }

    const preventZoomKeys = (event) => {
      const blockedKeys = ['+', '-', '=', '_', '0']
      if ((event.ctrlKey || event.metaKey) && blockedKeys.includes(event.key)) {
        event.preventDefault()
      }
    }

    const preventGesture = (event) => {
      event.preventDefault()
    }

    window.addEventListener('wheel', preventZoomWheel, { passive: false })
    window.addEventListener('keydown', preventZoomKeys)
    window.addEventListener('gesturestart', preventGesture)
    window.addEventListener('gesturechange', preventGesture)

    return () => {
      window.removeEventListener('wheel', preventZoomWheel)
      window.removeEventListener('keydown', preventZoomKeys)
      window.removeEventListener('gesturestart', preventGesture)
      window.removeEventListener('gesturechange', preventGesture)
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((previous) => {
      const nextForm = {
        ...previous,
        [name]: value
      }

      if (name === 'role' && value !== 'manager') {
        nextForm.companyName = ''
      }

      return nextForm
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setDevVerificationUrl('')
    try {
      const data = await register(form)
      setSubmittedEmail(form.email)
      setMessage(data.message || 'Account created successfully. Please verify your email before logging in.')
      setDevVerificationUrl(data.devVerificationUrl || '')

      if (!data.requiresEmailVerification) {
        setTimeout(() => navigate('/login'), 500)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed')
    }
  }

  const handleResendVerification = async () => {
    const targetEmail = submittedEmail || form.email
    if (!targetEmail) return

    setResending(true)
    setError('')
    setDevVerificationUrl('')
    try {
      const data = await resendVerification(targetEmail)
      setMessage(data.message || 'Verification email sent. Please check your inbox.')
      setDevVerificationUrl(data.devVerificationUrl || '')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend verification email')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="auth-shell login-page-fixed">
      <div className="auth-backdrop" aria-hidden="true" />
      <div className="login-reference-card signup-reference-card">
        <div
          className="login-reference-form-panel signup-reference-form-panel"
          style={{ overflowY: 'auto', maxHeight: '100vh' }}
        >
          <div className="login-reference-brand">
            <span className="brand-dark">Key</span>
            <span className="brand-accent">Cove</span>
          </div>

          <h1>Create<br />Account</h1>
          <p className="login-reference-subtext">Set up your KeyCove account to explore listings and manage role-based property tools.</p>

          <form onSubmit={handleSubmit} className="login-reference-form signup-reference-form">
            <input
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <input
              name="phone"
              placeholder="Phone Number"
              value={form.phone}
              onChange={handleChange}
              required
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="signup-reference-select"
            >
              <option value="tenant">Tenant</option>
              <option value="manager">Manager</option>
            </select>
            {form.role === 'manager' ? (
              <input
                name="companyName"
                placeholder="Company Name (optional)"
                value={form.companyName}
                onChange={handleChange}
              />
            ) : null}
            <button type="submit" className="login-reference-button">Sign up</button>
          </form>

          {message && <p className="success-text login-error-text">{message}</p>}
          {devVerificationUrl ? (
            <p className="login-error-text auth-dev-link">
              Dev link: <a href={devVerificationUrl}>{devVerificationUrl}</a>
            </p>
          ) : null}
          {submittedEmail ? (
            <div className="auth-action-row">
              <button
                type="button"
                className="secondary-btn auth-secondary-action"
                onClick={handleResendVerification}
                disabled={resending}
              >
                {resending ? 'Sending...' : 'Resend verification email'}
              </button>
            </div>
          ) : null}
          {error && <p className="error-text login-error-text">{error}</p>}

          <p className="login-reference-footer">
            Already verified?<nobr> </nobr>
            <Link to="/login">Login</Link>
          </p>
        </div>

        <div className="login-reference-image-panel">
          <img src="/auth-city.jpg" alt="City skyline" className="login-reference-image" />
        </div>
      </div>
    </div>
  )
}