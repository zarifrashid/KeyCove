import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const { login } = useAuth()
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
    try {
      await login(form)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    }
  }

  return (
    <div className="auth-shell login-page-fixed">
      <div className="auth-backdrop" aria-hidden="true" />
      <div className="login-reference-card">
        <div className="login-reference-form-panel">
          <div className="login-reference-brand">
            <span className="brand-dark">Key</span>
            <span className="brand-accent">Cove</span>
          </div>

          <h1>Welcome<br />Back</h1>
          <p className="login-reference-subtext">Sign in to continue exploring properties and managing your account.</p>

          <form onSubmit={handleSubmit} className="login-reference-form">
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
            <button type="submit" className="login-reference-button">Login</button>
          </form>

          {error && <p className="error-text login-error-text">{error}</p>}

          <p className="login-reference-footer">
            Don&apos;t have an account?<nobr> </nobr>
            <Link to="/signup">Sign up</Link>
          </p>
        </div>

        <div className="login-reference-image-panel">
          <img src="/auth-city.jpg" alt="City skyline" className="login-reference-image" />
        </div>
      </div>
    </div>
  )
}
