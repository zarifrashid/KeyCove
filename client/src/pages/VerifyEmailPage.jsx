import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function VerifyEmailPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { verifyEmail } = useAuth()
  const [status, setStatus] = useState('checking')
  const [message, setMessage] = useState('Verifying your email address...')

  useEffect(() => {
    let isMounted = true

    async function runVerification() {
      try {
        const data = await verifyEmail(token)
        if (!isMounted) return
        setStatus('success')
        setMessage(data.message || 'Email verified successfully. Redirecting you to KeyCove...')
        setTimeout(() => navigate('/explore'), 900)
      } catch (err) {
        if (!isMounted) return
        setStatus('error')
        setMessage(err.response?.data?.message || 'Verification failed. Please request a new verification email from the login page.')
      }
    }

    if (token) {
      runVerification()
    } else {
      setStatus('error')
      setMessage('Verification token is missing.')
    }

    return () => {
      isMounted = false
    }
  }, [navigate, token])

  return (
    <div className="auth-shell login-page-fixed">
      <div className="auth-backdrop" aria-hidden="true" />
      <div className="login-reference-card verify-email-card">
        <div className="login-reference-form-panel verify-email-panel">
          <div className="login-reference-brand">
            <span className="brand-dark">Key</span>
            <span className="brand-accent">Cove</span>
          </div>
          <h1>Email<br />Verification</h1>
          <p className={`login-reference-subtext ${status === 'error' ? 'error-text' : 'success-text'}`}>
            {message}
          </p>
          <div className="auth-action-row">
            <Link className="secondary-btn auth-secondary-action" to="/login">Back to login</Link>
            {status === 'success' ? <Link className="primary-btn auth-secondary-action" to="/explore">Continue</Link> : null}
          </div>
        </div>
        <div className="login-reference-image-panel">
          <img src="/auth-city.jpg" alt="City skyline" className="login-reference-image" />
        </div>
      </div>
    </div>
  )
}
