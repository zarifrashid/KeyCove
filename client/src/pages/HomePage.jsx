import { useEffect, useMemo, useRef, useState } from 'react'
import Navbar from '../components/Navbar'
import PropertyMap from '../components/map/PropertyMap'
import PropertyList from '../components/property/PropertyList'
import SearchBar from '../components/search/SearchBar'
import AdvancedFilters from '../components/search/AdvancedFilters'
import SortDropdown from '../components/search/SortDropdown'
import ActiveFilterChips from '../components/search/ActiveFilterChips'
import { api, buildMapQuery } from '../lib/api'

const DHAKA_CENTER = [23.8103, 90.4125]
const DHAKA_AREAS = ['All', 'Dhanmondi', 'Gulshan', 'Banani', 'Uttara', 'Mirpur', 'Bashundhara']

const DEFAULT_FILTERS = {
  search: '',
  area: 'All',
  minPrice: '',
  maxPrice: '',
  minBeds: '',
  maxBeds: '',
  minBaths: '',
  maxBaths: '',
  minSquareFeet: '',
  maxSquareFeet: '',
  propertyType: [],
  listingType: [],
  amenities: [],
  availableFrom: '',
  postedAfter: '',
  sort: 'newest'
}

export default function HomePage() {
  const [properties, setProperties] = useState([])
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [stats, setStats] = useState({ totalActive: 0, areaBreakdown: [] })
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 9 })
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS })
  const [mapState, setMapState] = useState({ center: DHAKA_CENTER, zoom: 12, bounds: null })
  const [status, setStatus] = useState({ loading: true, seeding: false, error: '' })
  const debounceRef = useRef(null)

  const fetchProperties = async ({
    page = 1,
    source = 'search',
    overrideFilters,
    overrideCenter,
    overrideBounds,
    overrideZoom
  } = {}) => {
    try {
      setStatus((previous) => ({ ...previous, loading: true, error: '' }))

      const center = overrideCenter || mapState.center
      const bounds = overrideBounds === undefined ? mapState.bounds : overrideBounds
      const activeFilters = overrideFilters || filters
      const activeZoom = overrideZoom ?? mapState.zoom

      const query = buildMapQuery({
        page,
        limit: pagination.limit,
        search: activeFilters.search,
        area: activeFilters.area === 'All' ? '' : activeFilters.area,
        minPrice: activeFilters.minPrice,
        maxPrice: activeFilters.maxPrice,
        minBeds: activeFilters.minBeds,
        maxBeds: activeFilters.maxBeds,
        minBaths: activeFilters.minBaths,
        maxBaths: activeFilters.maxBaths,
        minSquareFeet: activeFilters.minSquareFeet,
        maxSquareFeet: activeFilters.maxSquareFeet,
        propertyType: activeFilters.propertyType.join(','),
        listingType: activeFilters.listingType.join(','),
        amenities: activeFilters.amenities.join(','),
        availableFrom: activeFilters.availableFrom,
        postedAfter: activeFilters.postedAfter,
        sort: activeFilters.sort,
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
        api.get(`/properties/search?${query}`),
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
    fetchProperties({ page: 1, source: 'initial', overrideFilters: { ...DEFAULT_FILTERS }, overrideCenter: DHAKA_CENTER, overrideBounds: null, overrideZoom: 12 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSeed = async () => {
    try {
      setStatus((previous) => ({ ...previous, seeding: true, error: '' }))
      await api.post('/seed/dhaka-properties')
      await fetchProperties({ page: 1, source: 'reset', overrideFilters: filters })
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
    const nextFilters = {
      ...filters,
      search: searchText,
      area: matchedArea
    }
    setFilters(nextFilters)
    await fetchProperties({ page: 1, source: 'search', overrideFilters: nextFilters })
  }

  const handleAreaChange = async (area) => {
    const nextFilters = { ...filters, area }
    setFilters(nextFilters)
    await fetchProperties({ page: 1, source: 'filter', overrideFilters: nextFilters })
  }

  const handleApplyFilters = async () => {
    await fetchProperties({ page: 1, source: 'filter' })
  }

  const handleSortChange = async (sort) => {
    const nextFilters = { ...filters, sort }
    setFilters(nextFilters)
    await fetchProperties({ page: 1, source: 'filter', overrideFilters: nextFilters })
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
    setFilters({ ...DEFAULT_FILTERS })
    setMapState(resetState)
    await fetchProperties({
      page: 1,
      source: 'reset',
      overrideFilters: { ...DEFAULT_FILTERS },
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
            <span className="badge">Feature 1 + Feature 2</span>
            <h1>Explore Dhaka properties with map discovery and advanced backend search</h1>
            <p>
              Search by neighborhood, map area, price, beds, baths, area, amenities, listing type, and property type.
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
              <span>Search results</span>
              <strong>{pagination.total}</strong>
            </div>
            <div className="mini-stat wide">
              <span>Area coverage</span>
              <strong>{statsSummary}</strong>
            </div>
          </div>
          <div className="seed-banner">
            <div>
              <strong>Need demo data?</strong>
              <p>Press once to populate Dhaka properties and a demo manager account.</p>
            </div>
            <button type="button" className="primary-btn" disabled={status.seeding} onClick={handleSeed}>
              {status.seeding ? 'Seeding...' : 'Populate Dhaka Seed Data'}
            </button>
          </div>
          {status.error && <p className="error-text">{status.error}</p>}
        </section>

        <AdvancedFilters
          filters={filters}
          onChange={setFilters}
          onApply={handleApplyFilters}
          onReset={handleReset}
        />

        <section className="map-results-layout">
          <div className="map-column card map-card">
            <div className="map-header-row">
              <div>
                <h2>Interactive Map</h2>
                <p>Move the map to narrow search results inside the current viewport.</p>
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
            <div className="results-header with-controls">
              <div>
                <h2>Property Results</h2>
                <p>{pagination.total} properties matched your current search and map view.</p>
              </div>
              <div className="results-control-panel">
                {status.loading && <span className="badge">Loading...</span>}
                <SortDropdown value={filters.sort} onChange={handleSortChange} />
              </div>
            </div>

            <ActiveFilterChips filters={filters} />

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
