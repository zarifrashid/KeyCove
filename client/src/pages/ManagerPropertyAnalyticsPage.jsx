import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
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

function ActivityBar({ label, value, max }) {
  const width = max > 0 ? Math.max(3, Math.round((Number(value || 0) / max) * 100)) : 0
  return (
    <div className="analytics-bar-row">
      <div className="analytics-bar-label">
        <span>{label}</span>
        <strong>{formatNumber(value)}</strong>
      </div>
      <div className="analytics-bar-track">
        <div style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

function EventLabel({ eventType }) {
  const labels = {
    view: 'Property view',
    favorite: 'Saved by tenant',
    unfavorite: 'Unsaved by tenant',
    request_submit: 'Request submitted',
    message_inquiry: 'Message inquiry',
    design_room_open: 'Design Rooms opened',
    compare_add: 'Added to comparison',
    compare_remove: 'Removed from comparison'
  }

  return labels[eventType] || eventType
}

export default function ManagerPropertyAnalyticsPage() {
  const { propertyId } = useParams()
  const [days, setDays] = useState(30)
  const [state, setState] = useState({ loading: true, error: '', property: null, analytics: null, suggestions: [], dailyActivity: [], recentEvents: [] })

  useEffect(() => {
    let ignore = false

    async function loadAnalytics() {
      try {
        setState((previous) => ({ ...previous, loading: true, error: '' }))
        const { data } = await api.get(`/analytics/manager/properties/${propertyId}?days=${days}`)
        if (ignore) return
        setState({
          loading: false,
          error: '',
          property: data.property || null,
          analytics: data.analytics || null,
          suggestions: data.suggestions || [],
          dailyActivity: data.dailyActivity || [],
          recentEvents: data.recentEvents || []
        })
      } catch (error) {
        if (ignore) return
        setState((previous) => ({
          ...previous,
          loading: false,
          error: error.response?.data?.message || 'Failed to load this property analytics.'
        }))
      }
    }

    loadAnalytics()
    return () => {
      ignore = true
    }
  }, [propertyId, days])

  const analytics = state.analytics || {}
  const property = state.property || {}
  const maxDailyViews = useMemo(() => Math.max(1, ...state.dailyActivity.map((item) => Number(item.views || 0))), [state.dailyActivity])

  return (
    <>
      <Navbar />
      <main className="page-wrap analytics-page-wrap">
        <section className="card analytics-property-hero-card">
          <img src={pickPropertyImage(property)} alt={property.title || 'Property'} />
          <div>
            <p className="badge">Property Analytics</p>
            <h1>{property.title || 'Listing analytics'}</h1>
            <p>{property.location?.address || 'Address not set'}{property.location?.area ? `, ${property.location.area}` : ''}</p>
            <strong>{formatCurrency(property.price)} • {property.listingType || 'rent'} • {property.status || 'unknown'}</strong>
            <div className="analytics-toolbar inline-toolbar">
              <select value={days} onChange={(event) => setDays(Number(event.target.value))}>
                {RANGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <Link to="/manager/analytics" className="secondary-btn">All Analytics</Link>
              {property._id ? <Link to={`/properties/${property._id}/edit`} className="primary-btn">Improve Listing</Link> : null}
            </div>
          </div>
        </section>

        {state.error ? <p className="error-text analytics-alert-text">{state.error}</p> : null}

        {state.loading ? (
          <section className="card analytics-empty-card">Loading analytics...</section>
        ) : (
          <>
            <section className="analytics-metric-grid">
              <MetricCard label="Views" value={formatNumber(analytics.views)} helper={`Last ${days} days`} />
              <MetricCard label="Unique Viewers" value={formatNumber(analytics.uniqueViewers)} helper="Tenant/session level" />
              <MetricCard label="Favorites" value={formatNumber(analytics.favorites)} helper="Saved property" />
              <MetricCard label="Requests" value={formatNumber(analytics.requests)} helper="Rent / lease / buy" />
              <MetricCard label="Messages" value={formatNumber(analytics.messages)} helper="First chat inquiry" />
              <MetricCard label="Design Rooms" value={formatNumber(analytics.designRoomOpens)} helper="Room planner opens" />
              <MetricCard label="Compare Adds" value={formatNumber(analytics.compareAdds)} helper="Decision Hub" />
              <MetricCard label="Conversion" value={`${analytics.conversionRate || '0.0'}%`} helper="Requests ÷ views" />
            </section>

            <section className="analytics-two-column-grid">
              <article className="card analytics-insight-card">
                <h2>Smart Suggestions</h2>
                <div className="analytics-suggestion-list">
                  {state.suggestions.map((suggestion) => (
                    <div key={suggestion} className="analytics-suggestion-item">
                      <strong>Recommendation</strong>
                      <p>{suggestion}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="card analytics-insight-card">
                <h2>Engagement Breakdown</h2>
                <ActivityBar label="Views" value={analytics.views} max={Math.max(analytics.views || 0, analytics.favorites || 0, analytics.requests || 0, analytics.messages || 0, analytics.designRoomOpens || 0, analytics.compareAdds || 0)} />
                <ActivityBar label="Favorites" value={analytics.favorites} max={Math.max(analytics.views || 0, 1)} />
                <ActivityBar label="Requests" value={analytics.requests} max={Math.max(analytics.views || 0, 1)} />
                <ActivityBar label="Messages" value={analytics.messages} max={Math.max(analytics.views || 0, 1)} />
                <ActivityBar label="Design Rooms" value={analytics.designRoomOpens} max={Math.max(analytics.views || 0, 1)} />
                <ActivityBar label="Compare Adds" value={analytics.compareAdds} max={Math.max(analytics.views || 0, 1)} />
              </article>
            </section>

            <section className="analytics-two-column-grid">
              <article className="card analytics-insight-card">
                <h2>Daily Views</h2>
                <div className="analytics-daily-list">
                  {state.dailyActivity.slice(-14).map((item) => (
                    <ActivityBar key={item.date} label={item.date.slice(5)} value={item.views} max={maxDailyViews} />
                  ))}
                </div>
              </article>

              <article className="card analytics-insight-card">
                <h2>Recent Activity</h2>
                {state.recentEvents.length ? (
                  <div className="analytics-event-list">
                    {state.recentEvents.map((event) => (
                      <div key={event._id} className="analytics-event-item">
                        <strong><EventLabel eventType={event.eventType} /></strong>
                        <span>{new Date(event.createdAt).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted-text">No recent activity in this date range.</p>
                )}
              </article>
            </section>
          </>
        )}
      </main>
    </>
  )
}
