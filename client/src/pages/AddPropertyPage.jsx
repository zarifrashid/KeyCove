import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

export default function AddPropertyPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const tips = useMemo(() => [
    'Use clear property titles so the advanced search engine can match results properly.',
    'Add accurate area, price, square feet, beds, baths, and amenities before publishing.',
    'When the manager-side create form is ready, this page can be connected directly without changing your landing flow.'
  ], [])

  return (
    <>
      <Navbar />
      <div className="page-wrap">
        <div className="card dashboard-card add-property-card">
          <p className="badge">Protected Feature</p>
          <h2>Add Property</h2>
          <p>
            Hello {user?.name || 'User'}, this page is now part of the authenticated navigation flow. It gives you a safe
            destination for the <strong>+ Add Property</strong> button without changing your existing backend structure.
          </p>

          <div className="info-grid add-property-info-grid">
            <div><strong>Name:</strong> {user?.name}</div>
            <div><strong>Email:</strong> {user?.email}</div>
            <div><strong>Role:</strong> {user?.role}</div>
            <div><strong>Status:</strong> Authenticated</div>
          </div>

          <div className="add-property-tips">
            {tips.map((tip) => (
              <div key={tip} className="add-property-tip-item">{tip}</div>
            ))}
          </div>

          <div className="landing-actions add-property-actions">
            <button type="button" className="dark-btn" onClick={() => navigate('/explore')}>
              Explore Properties
            </button>
            <button type="button" className="gradient-btn" onClick={() => navigate('/dashboard')}>
              View Dashboard
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
