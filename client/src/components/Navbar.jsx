import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar({ unreadMessages = 0 }) {
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
          {user?.role === 'tenant' ? <Link to="/mortgage-calculator" className="explore-nav-link">Mortgage</Link> : null}
          {user?.role === 'tenant' ? <Link to="/shared-boards" className="explore-nav-link">Shared Search</Link> : null}
          <Link to="/messages" className="explore-nav-link">Messages{unreadMessages > 0 ? ` (${unreadMessages})` : ''}</Link>
          <Link to="/dashboard" className="explore-nav-link">Dashboard</Link>
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
            {user?.role === 'manager' ? <Link to="/add-property">Add Property</Link> : null}
            {user?.role === 'manager' ? <Link to="/manager/leases">Lease Details</Link> : null}
            {user?.role === 'tenant' ? <Link to="/my-leases">My Leases</Link> : null}
            {user?.role === 'tenant' ? <Link to="/affordability">Affordability</Link> : null}
            {user?.role === 'tenant' ? <Link to="/mortgage-calculator">Mortgage</Link> : null}
            {user?.role === 'tenant' ? <Link to="/recommendations">Recommendations</Link> : null}
            {user?.role === 'tenant' ? <Link to="/shared-boards">Shared Search</Link> : null}
            <Link to="/messages">Messages{unreadMessages > 0 ? ` (${unreadMessages})` : ''}</Link>
            <Link to="/dashboard">Dashboard</Link>
            <button onClick={handleLogout} className="button-link">Logout</button>
          </>
        )}
      </div>
    </nav>
  )
}
