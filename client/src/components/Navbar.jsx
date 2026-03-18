import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isExplorePage = location.pathname === '/explore' && !!user

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  if (isExplorePage) {
    return (
      <nav className="explore-nav">
        <div className="explore-nav-left">
          <Link to="/" className="explore-brand" aria-label="KeyCove home">
            <img src="/keycove-logo.png" alt="KeyCove" className="explore-brand-logo" />
          </Link>
        </div>

        <div className="explore-nav-center">
          <Link to="/explore" className="explore-nav-link active">Explore Map</Link>
        </div>

        <div className="explore-nav-right">
          <Link to="/" className="explore-nav-link">Contact Us</Link>
          <button onClick={handleLogout} className="explore-logout-btn">Logout</button>
        </div>
      </nav>
    )
  }

  return (
    <nav className="nav">
      <div className="nav-left">
        <Link to="/" className="brand">KeyCove</Link>
        <span className="nav-caption">Interactive Dhaka Property Discovery</span>
      </div>
      <div className="nav-links">
        {!user ? (
          <>
            <Link to="/">Landing</Link>
            <Link to="/login">Login</Link>
            <Link to="/signup" className="button-link">Sign Up</Link>
          </>
        ) : (
          <>
            <Link to="/">Landing</Link>
            <Link to="/explore">Explore Map</Link>
            <Link to="/add-property">Add Property</Link>
            <Link to="/dashboard">Dashboard</Link>
            <button onClick={handleLogout} className="button-link">Logout</button>
          </>
        )}
      </div>
    </nav>
  )
}
