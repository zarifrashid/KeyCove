import { Link } from 'react-router-dom'

function formatCurrency(value) {
  return `৳ ${Number(value || 0).toLocaleString()}`
}

export default function AffordabilityActiveBanner({ profile, active, onEnable, onDisable }) {
  if (!profile) {
    return (
      <section className="card affordability-banner-card affordability-banner-empty">
        <div>
          <p className="badge">Budget-safe rentals</p>
          <h3>No affordability profile saved yet</h3>
          <p>Create a saved affordability profile to filter Explore results more accurately.</p>
        </div>
        <Link to="/affordability" className="primary-btn">Open affordability tool</Link>
      </section>
    )
  }

  return (
    <section className="card affordability-banner-card">
      <div>
        <p className="badge">Budget-safe rentals</p>
        <h3>{active ? 'Affordability filter is active' : 'Use your saved affordability profile'}</h3>
        <p>
          Safe rent: <strong>{formatCurrency(profile.safeMonthlyRent)}</strong> · Recommended range: {formatCurrency(profile.recommendedMinRent)} – {formatCurrency(profile.recommendedMaxRent)}
        </p>
      </div>
      <div className="hero-actions affordability-banner-actions">
        {!active ? (
          <button type="button" className="primary-btn" onClick={onEnable}>Show affordable listings</button>
        ) : (
          <button type="button" className="secondary-btn" onClick={onDisable}>Clear affordability filter</button>
        )}
        <Link to="/affordability" className="secondary-btn">Update profile</Link>
      </div>
    </section>
  )
}
