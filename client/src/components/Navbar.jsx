import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="nav">
      <div className="nav-left">
        <Link to="/" className="brand">KeyCove</Link>
        <span className="nav-caption">Interactive Dhaka Property Discovery</span>
      </div>
      <div className="nav-links">
        <Link to="/">Explore Map</Link>
        {!user ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup" className="button-link">Sign Up</Link>
          </>
        ) : (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <button onClick={handleLogout} className="button-link">Logout</button>
          </>
        )}
      </div>
    </nav>
  )
}
