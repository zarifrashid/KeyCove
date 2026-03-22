import { Link } from 'react-router-dom'

function formatCurrency(value) {
  return `৳ ${Number(value || 0).toLocaleString()}`
}

const BAND_LABELS = {
  'budget-safe': 'Budget-safe',
  'tight-budget': 'Tight budget',
  'debt-constrained': 'Debt-constrained'
}

export default function AffordabilityResultCard({ profile }) {
  if (!profile) return null

  return (
    <section className="card affordability-result-card">
      <div className="affordability-result-header">
        <div>
          <p className="badge">Your result</p>
          <h2>{formatCurrency(profile.safeMonthlyRent)} / month</h2>
          <p>{profile.interpretation}</p>
        </div>
        <span className="affordability-status-chip">{BAND_LABELS[profile.affordabilityBand] || 'Affordability profile'}</span>
      </div>

      <div className="affordability-metric-grid">
        <div className="mini-stat">
          <span>Recommended range</span>
          <strong>{formatCurrency(profile.recommendedMinRent)} – {formatCurrency(profile.recommendedMaxRent)}</strong>
        </div>
        <div className="mini-stat">
          <span>30% income cap</span>
          <strong>{formatCurrency(profile.thirtyPercentCap)}</strong>
        </div>
        <div className="mini-stat">
          <span>After debt & savings</span>
          <strong>{formatCurrency(profile.afterObligationsCap)}</strong>
        </div>
      </div>

      <div className="affordability-explainer-box">
        <h3>How this was calculated</h3>
        <p>{profile.explanation}</p>
        <p className="muted-text">Rule used: the safer of 30% of gross monthly income or income left after debt and savings.</p>
      </div>

      <div className="hero-actions">
        <Link to="/explore?budgetSafe=1" className="primary-btn">View budget-safe rentals</Link>
        <Link to="/recommendations" className="secondary-btn">Go to recommendations</Link>
      </div>
    </section>
  )
}
