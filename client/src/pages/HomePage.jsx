import { useEffect, useMemo, useRef, useState } from 'react'
import Navbar from '../components/Navbar'
import PropertyMap from '../components/map/PropertyMap'
import PropertyList from '../components/property/PropertyList'
import SearchBar from '../components/search/SearchBar'
import { api, buildMapQuery } from '../lib/api'

const DHAKA_CENTER = [23.8103, 90.4125]
const DHAKA_AREAS = ['All', 'Dhanmondi', 'Gulshan', 'Banani', 'Uttara', 'Mirpur', 'Bashundhara']

export default function HomePage() {
  const [properties, setProperties] = useState([])
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [stats, setStats] = useState({ totalActive: 0, areaBreakdown: [] })
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 9 })
  const [filters, setFilters] = useState({ search: '', area: 'All' })
  const [mapState, setMapState] = useState({ center: DHAKA_CENTER, zoom: 12, bounds: null })
  const [status, setStatus] = useState({ loading: true, seeding: false, error: '' })
  const debounceRef = useRef(null)

  const fetchProperties = async ({
    page = 1,
    source = 'search',
    overrideSearch,
    overrideArea,
    overrideCenter,
    overrideBounds,
    overrideZoom
  } = {}) => {
    try {
      setStatus((previous) => ({ ...previous, loading: true, error: '' }))

      const center = overrideCenter || mapState.center
      const bounds = overrideBounds || mapState.bounds
      const activeSearch = overrideSearch ?? filters.search
      const activeArea = overrideArea ?? filters.area
      const activeZoom = overrideZoom ?? mapState.zoom

      const query = buildMapQuery({
        page,
        limit: pagination.limit,
        search: activeSearch,
        area: activeArea === 'All' ? '' : activeArea,
        lat: center[0],
        lng: center[1],
        zoom: activeZoom,
        source,
        northEastLat: bounds?.northEastLat,
        northEastLng: bounds?.northEastLng,
        southWestLat: bounds?.southWestLat,
        southWestLng: bounds?.southWestLng
      })

      const [{ data: propertyData }, { data: statsData }] = await Promise.all([
        api.get(`/properties/map?${query}`),
        api.get('/properties/stats')
      ])

      setProperties(propertyData.properties)
      setSelectedProperty((current) => {
        if (current) {
          return propertyData.properties.find((item) => item._id === current._id) || propertyData.properties[0] || null
        }
        return propertyData.properties[0] || null
      })
      setPagination(propertyData.pagination)
      setStats(statsData)
      setStatus((previous) => ({ ...previous, loading: false }))
    } catch (error) {
      setStatus({ loading: false, seeding: false, error: error.response?.data?.message || 'Failed to load properties.' })
    }
  }

  useEffect(() => {
    fetchProperties({ page: 1, source: 'initial' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSeed = async () => {
    try {
      setStatus((previous) => ({ ...previous, seeding: true, error: '' }))
      await api.post('/seed/dhaka-properties')
      await fetchProperties({ page: 1, source: 'reset' })
      setStatus((previous) => ({ ...previous, seeding: false }))
    } catch (error) {
      setStatus((previous) => ({
        ...previous,
        seeding: false,
        error: error.response?.data?.message || 'Failed to seed demo properties.'
      }))
    }
  }

  const handleSearch = async (searchText) => {
    const matchedArea = DHAKA_AREAS.find((area) => area !== 'All' && area.toLowerCase() === searchText.trim().toLowerCase()) || 'All'
    setFilters({ search: searchText, area: matchedArea })
    await fetchProperties({ page: 1, source: 'search', overrideSearch: searchText, overrideArea: matchedArea })
  }

  const handleAreaChange = async (area) => {
    setFilters((previous) => ({ ...previous, area }))
    await fetchProperties({ page: 1, source: 'search', overrideArea: area })
  }

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setStatus((previous) => ({ ...previous, error: 'Geolocation is not supported by your browser.' }))
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextCenter = [position.coords.latitude, position.coords.longitude]
        setMapState((previous) => ({ ...previous, center: nextCenter, zoom: 13 }))
        await fetchProperties({ page: 1, source: 'current-location', overrideCenter: nextCenter, overrideZoom: 13 })
      },
      () => {
        setStatus((previous) => ({ ...previous, error: 'Unable to access your current location.' }))
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleReset = async () => {
    const resetState = { center: DHAKA_CENTER, zoom: 12, bounds: null }
    setFilters({ search: '', area: 'All' })
    setMapState(resetState)
    await fetchProperties({
      page: 1,
      source: 'reset',
      overrideSearch: '',
      overrideArea: 'All',
      overrideCenter: DHAKA_CENTER,
      overrideBounds: null,
      overrideZoom: 12
    })
  }

  const handleBoundsChange = (payload) => {
    const nextBounds = {
      northEastLat: payload.northEastLat,
      northEastLng: payload.northEastLng,
      southWestLat: payload.southWestLat,
      southWestLng: payload.southWestLng
    }

    const nextCenter = [payload.center.lat, payload.center.lng]

    setMapState({
      center: nextCenter,
      zoom: payload.zoom,
      bounds: nextBounds
    })

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      fetchProperties({
        page: 1,
        source: 'map-move',
        overrideCenter: nextCenter,
        overrideBounds: nextBounds,
        overrideZoom: payload.zoom
      })
    }, 500)
  }

  const statsSummary = useMemo(() => {
    return stats.areaBreakdown?.map((entry) => `${entry._id}: ${entry.count}`).join(' • ') || 'No area stats yet'
  }, [stats.areaBreakdown])

  return (
    <>
      <Navbar />
      <div className="discovery-page">
        <section className="search-hero card wide-discovery-card">
          <div>
            <span className="badge">Feature 1 • Interactive Map-Based Property Discovery</span>
            <h1>Explore Dhaka rentals on an interactive Bangladesh map</h1>
            <p>
              Search Dhaka neighborhoods, use your current location, click any map marker, and open full listing details.
            </p>
          </div>
          <SearchBar
            initialValue={filters.search}
            onSearch={handleSearch}
            onUseCurrentLocation={handleUseCurrentLocation}
            onReset={handleReset}
          />
          <div className="quick-filters">
            {DHAKA_AREAS.map((area) => (
              <button
                key={area}
                type="button"
                className={`chip-button ${filters.area === area ? 'active' : ''}`}
                onClick={() => handleAreaChange(area)}
              >
                {area}
              </button>
            ))}
          </div>
          <div className="stats-grid">
            <div className="mini-stat">
              <span>Active Dhaka listings</span>
              <strong>{stats.totalActive}</strong>
            </div>
            <div className="mini-stat">
              <span>Current page</span>
              <strong>{pagination.page} / {pagination.totalPages}</strong>
            </div>
            <div className="mini-stat wide">
              <span>Area coverage</span>
              <strong>{statsSummary}</strong>
            </div>
          </div>
          <div className="seed-banner">
            <div>
              <strong>Need demo data?</strong>
              <p>Press once to populate 30 Dhaka properties and a demo manager account.</p>
            </div>
            <button type="button" className="primary-btn" disabled={status.seeding} onClick={handleSeed}>
              {status.seeding ? 'Seeding...' : 'Populate Dhaka Seed Data'}
            </button>
          </div>
          {status.error && <p className="error-text">{status.error}</p>}
        </section>

        <section className="map-results-layout">
          <div className="map-column card map-card">
            <div className="map-header-row">
              <div>
                <h2>Interactive Map</h2>
                <p>Bangladesh-centered view focused on Dhaka property discovery.</p>
              </div>
              <span className="badge">Map + Marker Preview</span>
            </div>
            <PropertyMap
              center={mapState.center}
              zoom={mapState.zoom}
              properties={properties}
              selectedProperty={selectedProperty}
              onSelectProperty={setSelectedProperty}
              onBoundsChange={handleBoundsChange}
            />
          </div>

          <div className="results-column card results-card">
            <div className="results-header">
              <div>
                <h2>Property Results</h2>
                <p>{pagination.total} properties matched your current map view.</p>
              </div>
              {status.loading && <span className="badge">Loading...</span>}
            </div>

            <PropertyList
              properties={properties}
              selectedPropertyId={selectedProperty?._id}
              onSelectProperty={setSelectedProperty}
            />

            <div className="pagination-row">
              <button
                type="button"
                className="secondary-btn"
                disabled={pagination.page <= 1}
                onClick={() => fetchProperties({ page: pagination.page - 1, source: 'search' })}
              >
                Previous Page
              </button>
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <button
                type="button"
                className="secondary-btn"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchProperties({ page: pagination.page + 1, source: 'search' })}
              >
                Next Page
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
