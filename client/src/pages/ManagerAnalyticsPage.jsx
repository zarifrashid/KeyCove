import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { api } from '../lib/api'

const RANGE_OPTIONS = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' }
]

function formatNumber(value) {
  return Number(value || 0).toLocaleString()
}

function formatCurrency(value) {
  return `৳ ${Number(value || 0).toLocaleString()}`
}

function pickPropertyImage(property = {}) {
  if (property.image) return property.image
  const firstImage = Array.isArray(property.images) ? property.images.find((item) => item?.url) : null
  return firstImage?.url || 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'
}

function MetricCard({ label, value, helper }) {
  return (
    <article className="analytics-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {helper ? <small>{helper}</small> : null}
    </article>
  )
}

function PropertyAnalyticsRow({ item }) {
  const property = item.property || {}
  const analytics = item.analytics || {}
  const engagementScore =
    Number(analytics.views || 0) +
    Number(analytics.favorites || 0) * 3 +
    Number(analytics.requests || 0) * 8 +
    Number(analytics.messages || 0) * 5 +
    Number(analytics.designRoomOpens || 0) * 2 +
    Number(analytics.compareAdds || 0) * 4

  return (
    <article className="analytics-property-row">
      <div className="analytics-property-main">
        <img src={pickPropertyImage(property)} alt={property.title || 'Property'} />
        <div>
          <div className="analytics-property-title-line">
            <h3>{property.title || 'Untitled listing'}</h3>
            <span className={`analytics-status-pill status-${property.status || 'unknown'}`}>{property.status || 'unknown'}</span>
          </div>
          <p>{property.location?.area || 'Area not set'}{property.location?.city ? `, ${property.location.city}` : ''}</p>
          <small>{property.listingType || 'rent'} • {formatCurrency(property.price)} • score {engagementScore}</small>
        </div>
      </div>

      <div className="analytics-property-stats">
        <span><strong>{formatNumber(analytics.views)}</strong> views</span>
        <span><strong>{formatNumber(analytics.favorites)}</strong> saves</span>
        <span><strong>{formatNumber(analytics.requests)}</strong> requests</span>
        <span><strong>{formatNumber(analytics.messages)}</strong> messages</span>
        <span><strong>{analytics.conversionRate || '0.0'}%</strong> conversion</span>
      </div>

      <div className="analytics-property-actions">
        <Link to={`/manager/properties/${property._id}/analytics`} className="secondary-btn">View Details</Link>
        <Link to={`/properties/${property._id}/edit`} className="secondary-btn">Improve Listing</Link>
      </div>
    </article>
  )
}

export default function ManagerAnalyticsPage() {
  const [days, setDays] = useState(30)
  const [state, setState] = useState({ loading: true, error: '', summary: null, properties: [], topProperties: [], attentionNeeded: [] })

  useEffect(() => {
    let ignore = false

    async function loadAnalytics() {
      try {
        setState((previous) => ({ ...previous, loading: true, error: '' }))
        const { data } = await api.get(`/analytics/manager/overview?days=${days}`)
        if (ignore) return
        setState({
          loading: false,
          error: '',
          summary: data.summary || null,
          properties: data.properties || [],
          topProperties: data.topProperties || [],
          attentionNeeded: data.attentionNeeded || []
        })
      } catch (error) {
        if (ignore) return
        setState((previous) => ({
          ...previous,
          loading: false,
          error: error.response?.data?.message || 'Failed to load manager analytics.'
        }))
      }
    }

    loadAnalytics()
    return () => {
      ignore = true
    }
  }, [days])

  const summary = state.summary || {}
  const strongestProperty = useMemo(() => state.topProperties?.[0], [state.topProperties])

  return (
    <>
      <Navbar />
      <main className="page-wrap analytics-page-wrap">
        <section className="card analytics-hero-card">
          <div>
            <p className="badge">Manager Analytics</p>
            <h1>Listing Performance Dashboard</h1>
            <p>
              Track listing views, favorites, tenant requests, message inquiries, Design Rooms opens, and comparison activity.
              Use these insights to improve weak listings and understand what tenants care about.
            </p>
          </div>
          <div className="analytics-toolbar">
            <select value={days} onChange={(event) => setDays(Number(event.target.value))}>
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <Link to="/dashboard" className="secondary-btn">Back to Dashboard</Link>
          </div>
        </section>

        {state.error ? <p className="error-text analytics-alert-text">{state.error}</p> : null}

        {state.loading ? (
          <section className="card analytics-empty-card">Loading analytics...</section>
        ) : (
          <>
            <section className="analytics-metric-grid">
              <MetricCard label="Total Listings" value={formatNumber(summary.totalProperties)} helper={`${formatNumber(summary.activeProperties)} active`} />
              <MetricCard label="Total Views" value={formatNumber(summary.views)} helper={`Last ${days} days`} />
              <MetricCard label="Unique Viewers" value={formatNumber(summary.uniqueViewers)} helper="Tenant/session level" />
              <MetricCard label="Favorites" value={formatNumber(summary.favorites)} helper="Saved listings" />
              <MetricCard label="Requests" value={formatNumber(summary.requests)} helper="Rent / lease / buy" />
              <MetricCard label="Messages" value={formatNumber(summary.messages)} helper="First chat inquiry" />
              <MetricCard label="Design Rooms" value={formatNumber(summary.designRoomOpens)} helper="Room planner opens" />
              <MetricCard label="Conversion Rate" value={`${summary.conversionRate || '0.0'}%`} helper="Requests ÷ views" />
            </section>

            <section className="analytics-two-column-grid">
              <article className="card analytics-insight-card">
                <h2>Top Performing Listing</h2>
                {strongestProperty ? (
                  <PropertyAnalyticsRow item={strongestProperty} />
                ) : (
                  <p className="muted-text">No engagement data yet. Tenant activity will appear here after people view or interact with your listings.</p>
                )}
              </article>

              <article className="card analytics-insight-card">
                <h2>Needs Attention</h2>
                {state.attentionNeeded.length ? (
                  <div className="analytics-suggestion-list">
                    {state.attentionNeeded.slice(0, 3).map((item) => (
                      <div key={item.property?._id} className="analytics-suggestion-item">
                        <strong>{item.property?.title || 'Untitled listing'}</strong>
                        <p>{item.suggestions?.[0] || 'Review this listing to improve engagement.'}</p>
                        <Link to={`/manager/properties/${item.property?._id}/analytics`}>Open analytics</Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted-text">No urgent listing issues found for this date range.</p>
                )}
              </article>
            </section>

            <section className="card analytics-list-card">
              <div className="analytics-section-header">
                <div>
                  <h2>All Listing Performance</h2>
                  <p>Compare property engagement and open a detailed page for deeper suggestions.</p>
                </div>
              </div>

              {state.properties.length ? (
                <div className="analytics-property-list">
                  {state.properties.map((item) => (
                    <PropertyAnalyticsRow key={item.property?._id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="analytics-empty-card">
                  <h3>No listings yet</h3>
                  <p>Create a property first. Analytics will appear once tenants start viewing and interacting with your listings.</p>
                  <Link to="/add-property" className="primary-btn">Add Property</Link>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </>
  )
}
