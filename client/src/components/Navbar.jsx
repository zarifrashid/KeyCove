import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './notifications/NotificationBell'

const PROFILE_STORAGE_KEY = 'keycoveProfessionalLinks'

function getInitialLinks() {
  try {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY)
    if (!saved) {
      return { portfolio: '', linkedin: '' }
    }
    const parsed = JSON.parse(saved)
    return {
      portfolio: parsed?.portfolio || '',
      linkedin: parsed?.linkedin || ''
    }
  } catch (_) {
    return { portfolio: '', linkedin: '' }
  }
}

function normalizeUrl(value) {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  return `https://${value}`
}

export default function Navbar({ unreadMessages = 0 }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [links, setLinks] = useState(getInitialLinks)
  const profileMenuRef = useRef(null)
  const toolsMenuRef = useRef(null)

  const usesTenantStyleHeader = !!user && (user.role === 'tenant' || user.role === 'manager')
  const isManager = !!user && user.role === 'manager'

  const initials = useMemo(() => {
    const name = user?.name?.trim() || 'U'
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('')
  }, [user?.name])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setMenuOpen(false)
      }
      if (!toolsMenuRef.current?.contains(event.target)) {
        setToolsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const handleChange = (event) => {
    const nextLinks = {
      ...links,
      [event.target.name]: event.target.value
    }
    setLinks(nextLinks)
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextLinks))
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleToolsNavigation = (path) => {
    setToolsOpen(false)
    navigate(path)
  }

  if (usesTenantStyleHeader) {
    return (
      <nav className="tenant-nav">
        <div className="tenant-nav-left">
          <div className="tenant-tools-wrap" ref={toolsMenuRef}>
            <button
              type="button"
              className={`tenant-tools-trigger ${toolsOpen ? 'open' : ''}`}
              onClick={() => setToolsOpen((previous) => !previous)}
              aria-expanded={toolsOpen}
              aria-haspopup="menu"
            >
              <span>Tools</span>
              <span className="tenant-nav-chevron" aria-hidden="true">⌄</span>
            </button>

            {toolsOpen ? (
              <div className="tenant-tools-dropdown" role="menu">
                <button type="button" className="tenant-tools-item" onClick={() => handleToolsNavigation('/mortgage-calculator')}>
                  <span className="tenant-tools-icon" aria-hidden="true">⌂</span>
                  <span>Mortgage</span>
                </button>
                <button type="button" className="tenant-tools-item" onClick={() => handleToolsNavigation('/affordability')}>
                  <span className="tenant-tools-icon" aria-hidden="true">▦</span>
                  <span>Affordability</span>
                </button>
              </div>
            ) : null}
          </div>

          <Link to="/explore" className={`tenant-nav-link ${location.pathname === '/explore' ? 'active' : ''}`}>
            Explore Map
          </Link>
        </div>

        <div className="tenant-nav-center">
          <Link to="/" className="tenant-brand" aria-label="KeyCove home">
            <span className="brand-dark">Key</span>
            <span className="brand-accent">Cove</span>
          </Link>
        </div>

        <div className="tenant-nav-right">
          <Link to="/messages" className={`tenant-nav-link ${location.pathname === '/messages' ? 'active' : ''}`}>
            Messages{unreadMessages > 0 ? ` (${unreadMessages})` : ''}
          </Link>

          {isManager ? (
            <>
              <Link to="/add-property" className={`tenant-manager-action-btn ${location.pathname === '/add-property' ? 'active' : ''}`}>
                Add Property
              </Link>
              <Link to="/manager/leases" className={`tenant-manager-action-btn ${location.pathname === '/manager/leases' ? 'active' : ''}`}>
                Lease Management
              </Link>
            </>
          ) : null}

          <Link to="/recommendations" className={`tenant-recommendation-btn ${location.pathname === '/recommendations' ? 'active' : ''}`}>
            Recommendation
          </Link>

          <NotificationBell compact />

          <div className="profile-menu-wrap tenant-profile-menu" ref={profileMenuRef}>
            <button type="button" className="tenant-profile-trigger" onClick={() => setMenuOpen((prev) => !prev)}>
              <div className="profile-avatar tenant-profile-avatar">{initials}</div>
              <span className="tenant-nav-chevron" aria-hidden="true">⌄</span>
            </button>

            {menuOpen && (
              <div className="profile-dropdown card tenant-profile-dropdown">
                <div className="profile-dropdown-header">
                  <div className="profile-avatar large">{initials}</div>
                  <div>
                    <strong>{user?.name || 'User'}</strong>
                    <p>{user?.email}</p>
                    <span className="badge">{user?.role || 'member'}</span>
                  </div>
                </div>

                <div className="profile-links-form">
                  <label>
                    Portfolio / Website
                    <input
                      type="url"
                      name="portfolio"
                      placeholder="https://your-portfolio.com"
                      value={links.portfolio}
                      onChange={handleChange}
                    />
                  </label>
                  <label>
                    LinkedIn Profile
                    <input
                      type="url"
                      name="linkedin"
                      placeholder="https://linkedin.com/in/your-name"
                      value={links.linkedin}
                      onChange={handleChange}
                    />
                  </label>
                </div>

                <div className="profile-actions-links">
                  {links.portfolio ? (
                    <a href={normalizeUrl(links.portfolio)} target="_blank" rel="noreferrer">Open Portfolio</a>
                  ) : (
                    <span>Portfolio not added</span>
                  )}
                  {links.linkedin ? (
                    <a href={normalizeUrl(links.linkedin)} target="_blank" rel="noreferrer">Open LinkedIn</a>
                  ) : (
                    <span>LinkedIn not added</span>
                  )}
                </div>

                <div className="profile-dropdown-actions">
                  <button type="button" className="secondary-btn" onClick={() => navigate('/dashboard')}>
                    View Profile
                  </button>
                  {user?.role === 'tenant' ? (
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => {
                        setMenuOpen(false)
                        navigate('/recently-viewed')
                      }}
                    >
                      Recently Viewed
                    </button>
                  ) : null}
                  <button type="button" className="primary-btn" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
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

            {/* Hide Explore Map for admin */}
            {user?.role !== 'admin' ? (
              <Link to="/explore">Explore Map</Link>
            ) : null}

            {user?.role === 'manager' ? <Link to="/add-property">Add Property</Link> : null}
            {user?.role === 'manager' ? <Link to="/manager/leases">Lease Details</Link> : null}
            {user?.role === 'manager' ? <Link to="/manager/analytics">Analytics</Link> : null}

            {user?.role === 'tenant' ? <Link to="/my-leases">My Leases</Link> : null}
            {user?.role === 'tenant' ? <Link to="/affordability">Affordability</Link> : null}
            {user?.role === 'tenant' ? <Link to="/mortgage-calculator">Mortgage</Link> : null}
            {user?.role === 'tenant' ? <Link to="/recommendations">Recommendations</Link> : null}
            {user?.role === 'tenant' ? <Link to="/decision-hub">Decision Hub</Link> : null}
            {user?.role === 'tenant' ? <Link to="/shared-boards">Shared Search</Link> : null}

            {user?.role === 'admin' ? <Link to="/admin">Admin Center</Link> : null}

            <NotificationBell />

            <Link to="/messages">
              Messages{unreadMessages > 0 ? ` (${unreadMessages})` : ''}
            </Link>

            <Link to="/dashboard">Dashboard</Link>

            <button onClick={handleLogout} className="button-link">
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
