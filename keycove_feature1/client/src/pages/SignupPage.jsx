import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'tenant' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const data = await register(form)
      setMessage(data.message || 'Account created successfully.')
      setTimeout(() => navigate('/login'), 800)
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed')
    }
  }

  return (
    <>
      <Navbar />
      <div className="page-wrap">
        <div className="card auth-card">
          <h2>Sign Up</h2>
          <p>Create a new KeyCove account.</p>
          <form onSubmit={handleSubmit} className="form">
            <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required />
            <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="tenant">Tenant</option>
              <option value="manager">Manager</option>
            </select>
            <button type="submit" className="primary-btn full-btn">Create Account</button>
          </form>
          {message && <p className="success-text">{message}</p>}
          {error && <p className="error-text">{error}</p>}
          <p>Already have an account? <Link to="/login">Login</Link></p>
        </div>
      </div>
    </>
  )
}
