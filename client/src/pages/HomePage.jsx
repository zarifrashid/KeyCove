import { useEffect, useMemo, useRef, useState } from 'react'
import Navbar from '../components/Navbar'
import PropertyMap from '../components/map/PropertyMap'
import PropertyList from '../components/property/PropertyList'
import SearchBar from '../components/search/SearchBar'
import AdvancedFilters from '../components/search/AdvancedFilters'
import ActiveFilterChips from '../components/search/ActiveFilterChips'
import { api, buildMapQuery } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import RecommendationSection from '../components/recommendations/RecommendationSection'

const DHAKA_CENTER = [23.8103, 90.4125]

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
  const { user } = useAuth()
  const [properties, setProperties] = useState([])
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [stats, setStats] = useState({ totalActive: 0, areaBreakdown: [] })
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 6 })
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS })
  const [mapState, setMapState] = useState({ center: DHAKA_CENTER, zoom: 12, bounds: null })
  const [status, setStatus] = useState({ loading: true, seeding: false, error: '' })
  const [isSearchOpen, setIsSearchOpen] = useState(true)
  const [isResultsOpen, setIsResultsOpen] = useState(true)
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
    fetchProperties({
      page: 1,
      source: 'initial',
      overrideFilters: { ...DEFAULT_FILTERS },
      overrideCenter: DHAKA_CENTER,
      overrideBounds: null,
      overrideZoom: 12
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = async (searchText) => {
    const nextFilters = {
      ...filters,
      search: searchText
    }
    setFilters(nextFilters)
    await fetchProperties({ page: 1, source: 'search', overrideFilters: nextFilters })
  }

  const handleApplyFilters = async () => {
    await fetchProperties({ page: 1, source: 'filter' })
  }

  const handleSortChange = async (sort) => {
    const nextFilters = { ...filters, sort }
    setFilters(nextFilters)
    await fetchProperties({ page: 1, source: 'filter', overrideFilters: nextFilters })
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

  const areaSummary = useMemo(() => {
    return stats.areaBreakdown?.map((entry) => `${entry._id}: ${entry.count}`).join(' • ') || 'No area stats yet'
  }, [stats.areaBreakdown])

  return (
    <>
      <Navbar />
      <div className="page-wrap explore-page-stack">
        {user?.role === 'tenant' ? <RecommendationSection compact /> : null}
      </div>
      <div className="explore-map-page dual-panel-layout">
        <div className="explore-map-background">
          <PropertyMap
            center={mapState.center}
            zoom={mapState.zoom}
            properties={properties}
            selectedProperty={selectedProperty}
            onSelectProperty={setSelectedProperty}
            onBoundsChange={handleBoundsChange}
          />
        </div>

        <aside className={`explore-panel explore-panel-left ${isSearchOpen ? 'open' : 'collapsed'}`}>
          {isSearchOpen && (
            <section className="panel-card filter-panel-card">
              <div className="panel-card-header compact-header-tight">
                <div>
                  <h2>Advanced Search</h2>
                  <p>Search and filter using your current backend logic.</p>
                </div>
                {status.loading && <span className="panel-status-pill">Loading...</span>}
              </div>

              <div className="panel-scroll-area search-scroll-area">
                <SearchBar
                  initialValue={filters.search}
                  onSearch={handleSearch}
                  compact
                />

                <AdvancedFilters
                  filters={filters}
                  onChange={setFilters}
                  onApply={handleApplyFilters}
                  onReset={handleReset}
                  onSortChange={handleSortChange}
                  compact
                />
              </div>
            </section>
          )}

          <button
            type="button"
            className="edge-toggle-btn edge-toggle-left panel-inner-toggle"
            onClick={() => setIsSearchOpen((previous) => !previous)}
            aria-label={isSearchOpen ? 'Hide filters' : 'Show filters'}
          >
            <span>{isSearchOpen ? '‹' : '›'}</span>
            <small>{isSearchOpen ? 'Hide' : 'Filters'}</small>
          </button>
        </aside>

        <aside className={`explore-panel explore-panel-right ${isResultsOpen ? 'open' : 'collapsed'}`}>
          <button
            type="button"
            className="edge-toggle-btn edge-toggle-right panel-inner-toggle"
            onClick={() => setIsResultsOpen((previous) => !previous)}
            aria-label={isResultsOpen ? 'Hide results' : 'Show results'}
          >
            <span>{isResultsOpen ? '›' : '‹'}</span>
            <small>{isResultsOpen ? 'Hide' : 'Results'}</small>
          </button>

          {isResultsOpen && (
            <section className="panel-card results-panel-card results-side-card">
              <div className="panel-card-header compact-header-tight results-panel-header">
                <div>
                  <h2>Property Results</h2>
                  <p>{pagination.total} matches in the current map view.</p>
                </div>
              </div>

              <div className="results-meta-strip">
                <span>{stats.totalActive} active listings</span>
                <span>Page {pagination.page} of {pagination.totalPages}</span>
              </div>

              <ActiveFilterChips filters={filters} />
              {status.error && <p className="error-text compact-error">{status.error}</p>}

              <div className="panel-scroll-area results-scroll-area">
                <PropertyList
                  properties={properties}
                  selectedPropertyId={selectedProperty?._id}
                  onSelectProperty={setSelectedProperty}
                  compact
                />
              </div>

              <div className="explore-pagination-row">
                <button
                  type="button"
                  className="secondary-btn"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchProperties({ page: pagination.page - 1, source: 'search' })}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchProperties({ page: pagination.page + 1, source: 'search' })}
                >
                  Next
                </button>
              </div>
            </section>
          )}
        </aside>
      </div>
    </>
  )
}
