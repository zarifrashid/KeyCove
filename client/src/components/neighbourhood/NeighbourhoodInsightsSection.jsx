import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import InsightLocalMap from './InsightLocalMap'

const TAB_OPTIONS = [
  { id: 'overview', label: 'Neighbourhood' },
  { id: 'walkability', label: 'Walkability' },
  { id: 'safety', label: 'Safety' },
  { id: 'schools', label: 'Schools' },
  { id: 'nearby', label: 'Nearby Places' },
  { id: 'map', label: 'View Local Map' }
]

const CATEGORY_LABELS = {
  school: 'Schools',
  college: 'Colleges',
  mosque: 'Mosques',
  hospital: 'Hospitals',
  shopping_mall: 'Shopping Malls',
  park: 'Parks',
  restaurant: 'Restaurants',
  transport: 'Transport',
  grocery: 'Grocery',
  pharmacy: 'Pharmacy',
  other: 'Other'
}

function formatDistance(distanceMeters) {
  if (!distanceMeters && distanceMeters !== 0) return 'N/A'
  return distanceMeters >= 1000 ? `${(distanceMeters / 1000).toFixed(1)} km` : `${distanceMeters} m`
}

function formatDate(value) {
  if (!value) return 'Not available'
  return new Date(value).toLocaleDateString('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function ScoreCard({ label, value, helper }) {
  return (
    <article className="insight-score-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {helper ? <small>{helper}</small> : null}
    </article>
  )
}

function TabButton({ id, label, activeTab, onSelect }) {
  return (
    <button
      type="button"
      className={`insight-tab-btn ${activeTab === id ? 'active' : ''}`}
      onClick={() => onSelect(id)}
    >
      {label}
    </button>
  )
}

function OverviewTab({ insight }) {
  return (
    <div className="insight-tab-content-grid">
      <div className="insight-summary-card">
        <div className="insight-summary-topline">
          <span className="badge">{insight.area || 'Dhaka'}</span>
          <span className="insight-last-updated">Updated {formatDate(insight.lastUpdated)}</span>
        </div>
        <p>{insight.summary || insight.message}</p>
      </div>

      <div className="insight-score-grid">
        <ScoreCard label="Walk Score" value={`${insight.walkScore}/100`} helper="Access to daily essentials nearby" />
        <ScoreCard label="Transit Score" value={`${insight.transitScore}/100`} helper="Road and transport convenience" />
        <ScoreCard label="Safety Index" value={`${insight.safetyIndex}/100`} helper="Curated local confidence signal" />
        <ScoreCard label="School Rating" value={`${insight.schoolRating}/5`} helper="Nearby school and college access" />
      </div>

      <div className="insight-panel-card">
        <h3>Quick local highlights</h3>
        <ul className="insight-list">
          {(insight.neighbourhoodHighlights || []).map((item) => (
            <li key={item}>{item}</li>
          ))}
          {!insight.neighbourhoodHighlights?.length ? <li>No highlights available yet.</li> : null}
        </ul>
      </div>
    </div>
  )
}

function WalkabilityTab({ insight }) {
  return (
    <div className="insight-tab-content-grid">
      <div className="insight-score-grid wide">
        <ScoreCard label="Walk Score" value={`${insight.walkScore}/100`} helper="Schools, groceries, parks, and daily stops nearby" />
        <ScoreCard label="Transit Score" value={`${insight.transitScore}/100`} helper="Useful for commuting across Dhaka" />
        <ScoreCard label="Bike Score" value={`${insight.bikeScore}/100`} helper="Curated based on road feel and open-space access" />
        <ScoreCard label="Convenience" value={`${insight.convenienceScore}/100`} helper="Blended daily-living comfort score" />
      </div>

      <div className="insight-panel-card">
        <h3>What this means</h3>
        <p>
          Higher walkability usually means the property has useful essentials like groceries, schools, transport stops,
          restaurants, and health services within a practical distance. For KeyCove, these values are stored after generation
          so tenants do not need to wait for external lookups every time.
        </p>
      </div>
    </div>
  )
}

function SafetyTab({ insight }) {
  return (
    <div className="insight-tab-content-grid two-col">
      <div className="insight-panel-card">
        <h3>Safety and local confidence</h3>
        <div className="insight-score-grid single">
          <ScoreCard label="Safety Index" value={`${insight.safetyIndex}/100`} helper="Curated neighbourhood-level indicator for development use" />
        </div>
        <p className="insight-note-text">
          This score is a development-friendly neighbourhood indicator based on area profile, hospital access, service density,
          and road practicality. It is not an official crime statistic or legal safety guarantee.
        </p>
      </div>

      <div className="insight-panel-card">
        <h3>Practical safety notes</h3>
        <ul className="insight-list">
          {(insight.safetyNotes || []).map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function SchoolsTab({ insight, schoolPlaces }) {
  return (
    <div className="insight-tab-content-grid two-col">
      <div className="insight-panel-card">
        <h3>Education snapshot</h3>
        <div className="insight-score-grid single">
          <ScoreCard label="School Rating" value={`${insight.schoolRating}/5`} helper="Blended school and college proximity score" />
          <ScoreCard label="Family Score" value={`${insight.familyFriendlinessScore}/100`} helper="Education, hospital, park, and daily convenience balance" />
        </div>
      </div>

      <div className="insight-panel-card">
        <h3>Nearby schools and colleges</h3>
        {schoolPlaces.length ? (
          <div className="insight-place-list">
            {schoolPlaces.map((place) => (
              <article key={place.name} className="insight-place-item">
                <div>
                  <strong>{place.name}</strong>
                  <span>{CATEGORY_LABELS[place.category]}</span>
                </div>
                <small>{formatDistance(place.distanceMeters)}</small>
              </article>
            ))}
          </div>
        ) : (
          <p>No school data available for this property yet.</p>
        )}
      </div>
    </div>
  )
}

function NearbyPlacesTab({ groupedPlaces }) {
  const categoryEntries = Object.entries(groupedPlaces)

  return (
    <div className="insight-category-grid">
      {categoryEntries.map(([category, places]) => (
        <section key={category} className="insight-panel-card">
          <h3>{CATEGORY_LABELS[category] || category}</h3>
          <div className="insight-place-list">
            {places.map((place) => (
              <article key={place.name} className="insight-place-item">
                <div>
                  <strong>{place.name}</strong>
                  <span>{place.address}</span>
                </div>
                <small>{formatDistance(place.distanceMeters)}</small>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export default function NeighbourhoodInsightsSection({ property }) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [insightState, setInsightState] = useState({ loading: true, refreshing: false, error: '', insight: null })

  useEffect(() => {
    let isMounted = true

    const fetchInsight = async () => {
      try {
        setInsightState({ loading: true, refreshing: false, error: '', insight: null })
        const { data } = await api.get(`/properties/${property._id}/neighbourhood-insights`)
        if (!isMounted) return
        setInsightState({ loading: false, refreshing: false, error: '', insight: data.insight })
      } catch (error) {
        if (!isMounted) return
        setInsightState({
          loading: false,
          refreshing: false,
          error: error.response?.data?.message || 'Failed to load neighbourhood insights.',
          insight: null
        })
      }
    }

    fetchInsight()

    return () => {
      isMounted = false
    }
  }, [property._id])

  const canRefresh = user?.role === 'manager' && property?.manager?._id && user.id === property.manager._id

  const groupedPlaces = useMemo(() => {
    return (insightState.insight?.nearbyPlaces || []).reduce((accumulator, place) => {
      if (!accumulator[place.category]) {
        accumulator[place.category] = []
      }

      accumulator[place.category].push(place)
      accumulator[place.category].sort((first, second) => first.distanceMeters - second.distanceMeters)
      return accumulator
    }, {})
  }, [insightState.insight])

  const schoolPlaces = useMemo(() => {
    const places = insightState.insight?.nearbyPlaces || []
    return places
      .filter((place) => place.category === 'school' || place.category === 'college')
      .sort((first, second) => first.distanceMeters - second.distanceMeters)
  }, [insightState.insight])

  const handleRefresh = async () => {
    try {
      setInsightState((previous) => ({ ...previous, refreshing: true, error: '' }))
      const { data } = await api.post(`/properties/${property._id}/neighbourhood-insights/refresh`)
      setInsightState({ loading: false, refreshing: false, error: '', insight: data.insight })
    } catch (error) {
      setInsightState((previous) => ({
        ...previous,
        refreshing: false,
        error: error.response?.data?.message || 'Failed to refresh neighbourhood insights.'
      }))
    }
  }

  const insight = insightState.insight

  return (
    <section className="card neighbourhood-card" id="neighbourhood-insights-section">
      <div className="neighbourhood-card-header">
        <div>
          <p className="badge">Feature 4</p>
          <h2>Neighbourhood Insights</h2>
          <p>
            Local context for this property in {property.location?.area || 'Dhaka'} including walkability, schools,
            safety, nearby places, and a small local map.
          </p>
        </div>

        {canRefresh ? (
          <button
            type="button"
            className="secondary-btn"
            disabled={insightState.refreshing}
            onClick={handleRefresh}
          >
            {insightState.refreshing ? 'Refreshing...' : 'Refresh Insights'}
          </button>
        ) : null}
      </div>

      {insightState.loading ? <div className="neighbourhood-loading">Loading neighbourhood insights...</div> : null}
      {insightState.error ? <p className="error-text">{insightState.error}</p> : null}

      {!insightState.loading && insight?.coverageStatus === 'unsupported' ? (
        <div className="insight-empty-state">
          <h3>Dhaka-only neighbourhood insights</h3>
          <p>{insight.message || 'Neighbourhood Insights are currently available only for supported Dhaka locations.'}</p>
        </div>
      ) : null}

      {!insightState.loading && insight?.coverageStatus === 'ready' ? (
        <>
          <div className="insight-tab-row">
            {TAB_OPTIONS.map((tab) => (
              <TabButton
                key={tab.id}
                id={tab.id}
                label={tab.label}
                activeTab={activeTab}
                onSelect={setActiveTab}
              />
            ))}
          </div>

          {activeTab === 'overview' ? <OverviewTab insight={insight} /> : null}
          {activeTab === 'walkability' ? <WalkabilityTab insight={insight} /> : null}
          {activeTab === 'safety' ? <SafetyTab insight={insight} /> : null}
          {activeTab === 'schools' ? <SchoolsTab insight={insight} schoolPlaces={schoolPlaces} /> : null}
          {activeTab === 'nearby' ? <NearbyPlacesTab groupedPlaces={groupedPlaces} /> : null}
          {activeTab === 'map' ? (
            <div className="insight-tab-content-grid">
              <div className="insight-panel-card">
                <h3>View local map</h3>
                <p>
                  This mini-map reuses the same mapping stack already used in KeyCove Explore Map and shows the property
                  together with curated nearby points of interest.
                </p>
              </div>
              <InsightLocalMap property={property} nearbyPlaces={insight.nearbyPlaces || []} />
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  )
}
