import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import PropertyMap from '../components/map/PropertyMap'
import PropertyList from '../components/property/PropertyList'
import SearchBar from '../components/search/SearchBar'
import AdvancedFilters from '../components/search/AdvancedFilters'
import ActiveFilterChips from '../components/search/ActiveFilterChips'
import { api, buildMapQuery } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import RecommendationSection from '../components/recommendations/RecommendationSection'
import AffordabilityActiveBanner from '../components/affordability/AffordabilityActiveBanner'
import useFavorites from '../hooks/useFavorites'

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

function classifyAffordability(propertyPrice, profile) {
  const safeRent = Number(profile?.safeMonthlyRent) || 0
  if (safeRent <= 0) return null
  const price = Number(propertyPrice) || 0

  if (price <= safeRent) return { label: 'Affordable', category: 'affordable' }
  if (price <= safeRent * 1.1) return { label: 'Borderline', category: 'borderline' }
  if (price <= safeRent * 1.25) return { label: 'Stretched', category: 'stretched' }
  return { label: 'Unaffordable', category: 'unaffordable' }
}

export default function HomePage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [properties, setProperties] = useState([])
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [stats, setStats] = useState({ totalActive: 0, areaBreakdown: [] })
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 6 })
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS })
  const [mapState, setMapState] = useState({ center: DHAKA_CENTER, zoom: 12, bounds: null })
  const [status, setStatus] = useState({ loading: true, seeding: false, error: '' })
  const [affordabilityProfile, setAffordabilityProfile] = useState(null)
  const [affordabilityFilterActive, setAffordabilityFilterActive] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(true)
  const [isResultsOpen, setIsResultsOpen] = useState(true)
  const debounceRef = useRef(null)
  const { favoriteIds, toggleFavorite } = useFavorites()
  const [bookmarkBusyId, setBookmarkBusyId] = useState('')

  const fetchLatestAffordability = async () => {
    if (user?.role !== 'tenant') return

    try {
      const { data } = await api.get('/affordability/latest')
      if (data.profile) {
        setAffordabilityProfile(data.profile)
        localStorage.setItem('keycoveAffordabilityProfile', JSON.stringify(data.profile))
      } else {
        const cachedProfile = localStorage.getItem('keycoveAffordabilityProfile')
        setAffordabilityProfile(cachedProfile ? JSON.parse(cachedProfile) : null)
      }
    } catch (_) {
      const cachedProfile = localStorage.getItem('keycoveAffordabilityProfile')
      setAffordabilityProfile(cachedProfile ? JSON.parse(cachedProfile) : null)
    }
  }

  const buildEffectiveFilters = (activeFilters) => {
    if (!affordabilityFilterActive || !affordabilityProfile || user?.role !== 'tenant') {
      return activeFilters
    }

    return {
      ...activeFilters,
      listingType: activeFilters.listingType.includes('rent') ? activeFilters.listingType : ['rent'],
      maxPrice: String(affordabilityProfile.safeMonthlyRent || activeFilters.maxPrice || '')
    }
  }

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
      const effectiveFilters = buildEffectiveFilters(activeFilters)
      const affordabilityAdjustedFilters =
        affordabilityFilterActive && affordabilityProfile?.safeMonthlyRent
          ? {
              ...effectiveFilters,
              maxPrice: String(
                Math.min(
                  Number(effectiveFilters.maxPrice || affordabilityProfile.safeMonthlyRent),
                  Number(affordabilityProfile.safeMonthlyRent)
               )
             ),
             listingType: ['rent']
       }
       : effectiveFilters
      const activeZoom = overrideZoom ?? mapState.zoom
      console.log('AFFORDABILITY DEBUG', {
        affordabilityFilterActive,
        safeMonthlyRent: affordabilityProfile?.safeMonthlyRent,
        effectiveFilters,
        affordabilityAdjustedFilters
      })
      const query = buildMapQuery({
        page,
        limit: pagination.limit,
        search: affordabilityAdjustedFilters.search,
        area: affordabilityAdjustedFilters.area === 'All' ? '' : affordabilityAdjustedFilters.area,
        minPrice: affordabilityAdjustedFilters.minPrice,
        maxPrice: affordabilityAdjustedFilters.maxPrice,
        minBeds: affordabilityAdjustedFilters.minBeds,
        maxBeds: affordabilityAdjustedFilters.maxBeds,
        minBaths: affordabilityAdjustedFilters.minBaths,
        maxBaths: affordabilityAdjustedFilters.maxBaths,
        minSquareFeet: affordabilityAdjustedFilters.minSquareFeet,
        maxSquareFeet: affordabilityAdjustedFilters.maxSquareFeet,
        propertyType: affordabilityAdjustedFilters.propertyType.join(','),
        listingType: affordabilityAdjustedFilters.listingType.join(','),
        amenities: affordabilityAdjustedFilters.amenities.join(','),
        availableFrom: affordabilityAdjustedFilters.availableFrom,
        postedAfter: affordabilityAdjustedFilters.postedAfter,
        sort: affordabilityAdjustedFilters.sort, 
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

      const enrichedProperties = user?.role === 'tenant' && affordabilityProfile
        ? propertyData.properties.map((item) => {
          const affordability = classifyAffordability(item.price, affordabilityProfile)
          return {
            ...item,
            affordabilityLabel: affordability?.label || '',
            affordabilityCategory: affordability?.category || ''
          }
        })
        : propertyData.properties
      console.log('PROPERTY DEBUG', {
        source,
        count: enrichedProperties.length,
        prices: enrichedProperties.map((item) => item.price)
      })
      setProperties(enrichedProperties)
      setSelectedProperty((current) => {
        if (current) {
          return enrichedProperties.find((item) => item._id === current._id) || enrichedProperties[0] || null
        }
        return enrichedProperties[0] || null
      })
      setPagination(propertyData.pagination)
      setStats(statsData)
      setStatus((previous) => ({ ...previous, loading: false }))
    } catch (error) {
      setStatus({ loading: false, seeding: false, error: error.response?.data?.message || 'Failed to load properties.' })
    }
  }

  useEffect(() => {
    fetchLatestAffordability()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role])

  useEffect(() => {
    const budgetSafe = searchParams.get('budgetSafe') === '1'
    setAffordabilityFilterActive(budgetSafe)
    fetchProperties({
      page: 1,
      source: budgetSafe ? 'affordability-entry' : 'initial',
      overrideFilters: { ...DEFAULT_FILTERS },
      overrideCenter: DHAKA_CENTER,
      overrideBounds: null,
      overrideZoom: 12
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, affordabilityProfile?.safeMonthlyRent])

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

  const handleBoundsChange = useCallback((payload) => {
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
        source: affordabilityFilterActive ? 'affordability-map-move' : 'map-move',
        overrideCenter: nextCenter,
        overrideBounds: nextBounds,
        overrideZoom: payload.zoom
      })
    }, 500)
  }, [fetchProperties])

  const areaSummary = useMemo(() => {
    return stats.areaBreakdown?.map((entry) => `${entry._id}: ${entry.count}`).join(' • ') || 'No area stats yet'
  }, [stats.areaBreakdown])

  const activateAffordabilityFilter = () => {
    setSearchParams({ budgetSafe: '1' })
  }

  const clearAffordabilityFilter = () => {
    setSearchParams({})
  }

  const handleToggleFavorite = async (propertyId) => {
    try {
      setBookmarkBusyId(propertyId)
      await toggleFavorite(propertyId)
    } finally {
      setBookmarkBusyId('')
    }
  }

  return (
    <>
      <Navbar />
      <div className="page-wrap explore-page-stack">
        {/*user?.role === 'tenant' ? <RecommendationSection compact /> : null} */}
        {user?.role === 'tenant' && !affordabilityFilterActive ? <RecommendationSection compact /> : null}
        {user?.role === 'tenant' ? (
          <AffordabilityActiveBanner
            profile={affordabilityProfile}
            active={affordabilityFilterActive}
            onEnable={activateAffordabilityFilter}
            onDisable={clearAffordabilityFilter}
          />
        ) : null}
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

                {affordabilityFilterActive && affordabilityProfile ? (
                  <div className="affordability-filter-note">
                    <strong>Affordability filter is on.</strong>
                    <span>Showing rent listings up to ৳ {Number(affordabilityProfile.safeMonthlyRent || 0).toLocaleString()}.</span>
                  </div>
                ) : null}
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
                <span>{affordabilityFilterActive ? `${pagination.total} budget-safe listings` : `${stats.totalActive} active listings`}</span>
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
                  favoriteIds={favoriteIds}
                  onToggleFavorite={user?.role === 'tenant' ? handleToggleFavorite : null}
                  bookmarkBusyId={bookmarkBusyId}
                  emptyTitle={affordabilityFilterActive ? 'No current listings match your affordability range' : 'No properties found'}
                  emptyText={affordabilityFilterActive ? 'Try updating your affordability profile or clear the affordability filter to explore more rentals.' : 'Try another search, adjust filters, or move the map.'}
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
