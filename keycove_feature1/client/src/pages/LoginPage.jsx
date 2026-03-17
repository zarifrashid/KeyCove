import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    }
  }

  return (
    <>
      <Navbar />
      <div className="page-wrap">
        <div className="card auth-card">
          <h2>Login</h2>
          <p>Log in to your KeyCove account.</p>
          <form onSubmit={handleSubmit} className="form">
            <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
            <button type="submit" className="primary-btn full-btn">Login</button>
          </form>
          {error && <p className="error-text">{error}</p>}
          <p>New here? <Link to="/signup">Create an account</Link></p>
        </div>
      </div>
    </>
  )
}
