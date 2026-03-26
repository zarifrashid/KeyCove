import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'tenant' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const { register, login } = useAuth()
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
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      const data = await register(form)
      setMessage(data.message || 'Account created successfully.')
      await login({ email: form.email, password: form.password })
      setTimeout(() => navigate('/'), 500)
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed')
    }
  }

  return (
    <div className="auth-shell login-page-fixed">
      <div className="auth-backdrop" aria-hidden="true" />
      <div className="login-reference-card signup-reference-card">
        <div className="login-reference-form-panel signup-reference-form-panel">
          <div className="login-reference-brand">
            <span className="brand-dark">Key</span>
            <span className="brand-accent">Cove</span>
          </div>

          <h1>Create<br />Account</h1>
          <p className="login-reference-subtext">Set up your KeyCove account to explore listings and add new properties.</p>

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
            <button type="submit" className="login-reference-button">Sign up</button>
          </form>

          {message && <p className="success-text login-error-text">{message}</p>}
          {error && <p className="error-text login-error-text">{error}</p>}

          <p className="login-reference-footer">
            Already have an account?<nobr> </nobr>
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
