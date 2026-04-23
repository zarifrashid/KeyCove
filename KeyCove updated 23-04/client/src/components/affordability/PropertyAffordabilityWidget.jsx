import { Link } from 'react-router-dom'

const STATUS_CLASS = {
  affordable: 'affordability-pill-safe',
  borderline: 'affordability-pill-borderline',
  stretched: 'affordability-pill-stretched',
  unaffordable: 'affordability-pill-unsafe'
}

function formatCurrency(value) {
  return `৳ ${Number(value || 0).toLocaleString()}`
}

export default function PropertyAffordabilityWidget({ summary, loading, error, onRefresh }) {
  return (
    <section className="property-affordability-widget">
      <div className="section-heading-row compact-heading-row">
        <div>
          <h3>Affordability check</h3>
          <p>Compare this listing against your latest saved affordability profile.</p>
        </div>
        <button type="button" className="secondary-btn" onClick={onRefresh} disabled={loading}>
          {loading ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      {error ? (
        <div className="empty-state compact-empty-state left-aligned-state">
          <h3>No affordability profile yet</h3>
          <p>{error}</p>
          <Link to="/affordability" className="primary-btn">Create affordability profile</Link>
        </div>
      ) : null}

      {!error && summary ? (
        !summary.applicable ? (
          <div className="affordability-widget-body">
            <span className="affordability-status-chip">Rent-only check</span>
            <p>{summary.message}</p>
          </div>
        ) : (
          <div className="affordability-widget-body">
            <div className="affordability-widget-topline">
              <span className={`affordability-status-chip ${STATUS_CLASS[summary.category] || ''}`}>{summary.label}</span>
              <strong>{formatCurrency(summary.price)} / month</strong>
            </div>
            <p>{summary.shortMessage}</p>
            <div className="affordability-widget-grid">
              <div>
                <span>Your safe rent</span>
                <strong>{formatCurrency(summary.safeMonthlyRent)}</strong>
              </div>
              <div>
                <span>Recommended range</span>
                <strong>{formatCurrency(summary.recommendedMinRent)} – {formatCurrency(summary.recommendedMaxRent)}</strong>
              </div>
              <div>
                <span>Difference</span>
                <strong>{formatCurrency(summary.difference)}</strong>
              </div>
            </div>
            <p className="muted-text">{summary.detailMessage}</p>
          </div>
        )
      ) : null}
    </section>
  )
}
