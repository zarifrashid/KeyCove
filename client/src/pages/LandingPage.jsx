import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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

export default function LandingPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [links, setLinks] = useState(getInitialLinks)

  const initials = useMemo(() => {
    const name = user?.name?.trim() || 'U'
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('')
  }, [user?.name])

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

  const goToProtectedFeature = (path) => {
    if (!user) {
      navigate('/login')
      return
    }
    navigate(path)
  }

  return (
    <div className="landing-shell">
      <div className="landing-topbar">
        <Link to="/" className="landing-brand">
          Key<span>Cove</span>
        </Link>

        {user ? (
          <div className="profile-menu-wrap">
            <button type="button" className="profile-trigger" onClick={() => setMenuOpen((prev) => !prev)}>
              <div className="profile-avatar">{initials}</div>
            </button>

            {menuOpen && (
              <div className="profile-dropdown card">
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
                  <button type="button" className="primary-btn" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="landing-auth-links">
            <button type="button" className="landing-ghost-btn" onClick={() => navigate('/login')}>
              Login
            </button>
            <button type="button" className="landing-solid-btn" onClick={() => navigate('/signup')}>
              Sign Up
            </button>
          </div>
        )}
      </div>

      <main className="landing-content">
        <section className="landing-copy">
          <h1>
            Invest in <span>Your Future</span> with Confidence
          </h1>
          <p>
            Discover Dhaka properties with your existing map experience, and access feature areas only after secure login.
            Use this landing page as the main entry point for both exploration and property management.
          </p>

          <div className="landing-actions">
            <button type="button" className="dark-btn" onClick={() => goToProtectedFeature('/explore')}>
              Explore Properties
            </button>
            <button type="button" className="gradient-btn" onClick={() => goToProtectedFeature('/add-property')}>
              + Add Property
            </button>
          </div>

          <div className="landing-user-card">
            {user ? (
              <>
                <div>
                  <span className="landing-user-label">Signed in as</span>
                  <strong>{user?.name}</strong>
                  <p>{user?.email}</p>
                </div>
                <span className="badge">Secure access enabled</span>
              </>
            ) : (
              <>
                <div>
                  <span className="landing-user-label">Guest access</span>
                  <strong>Login required for property tools</strong>
                  <p>Use the buttons above and sign in when you are ready to continue.</p>
                </div>
                <span className="badge">Authentication required</span>
              </>
            )}
          </div>
        </section>

        <section className="landing-gallery">
          <div className="gallery-card gallery-large">
            <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80" alt="Modern luxury home exterior" />
          </div>
          <div className="gallery-grid-two">
            <div className="gallery-card">
              <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80" alt="Contemporary house at sunset" />
            </div>
            <div className="gallery-card">
              <img src="https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=900&q=80" alt="Luxury property with pool" />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
