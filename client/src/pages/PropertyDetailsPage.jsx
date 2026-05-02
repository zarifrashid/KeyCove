import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import NeighbourhoodInsightsSection from '../components/neighbourhood/NeighbourhoodInsightsSection'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import useFavorites from '../hooks/useFavorites'
import PropertyAffordabilityWidget from '../components/affordability/PropertyAffordabilityWidget'
import PropertyMortgageWidget from '../components/mortgage/PropertyMortgageWidget'
import BoardPickerModal from '../components/sharedBoards/BoardPickerModal'
import ARPropertyViewer from '../components/ar/ARPropertyViewer'
import DecisionNotePanel from '../components/decisionHub/DecisionNotePanel'
import TrustBadge from '../components/decisionHub/TrustBadge'
import ReportListingButton from '../components/reports/ReportListingButton'

const AMENITY_ICON_MAP = {
  Lift: '⇅',
  Parking: '🅿',
  '24/7 Security': '🛡',
  'Generator Backup': '⚡',
  'Gym Access': '🏋',
  'Rooftop Garden': '🌿',
  'Community Hall': '🏛',
  CCTV: '📹',
  Reception: '🏢',
  Intercom: '☎',
  'Swimming Pool': '🏊',
  Garden: '🌳'
}

function formatCurrency(value, listingType) {
  const amount = `৳ ${Number(value || 0).toLocaleString()}`
  return listingType === 'rent' ? `${amount} / month` : amount
}

function getRentPrice(property) {
  if (Number(property?.rentPrice) > 0) return Number(property.rentPrice)
  if (property?.listingType === 'rent' && Number(property?.price) > 0) return Number(property.price)
  return 0
}

function getSalePrice(property) {
  if (Number(property?.salePrice) > 0) return Number(property.salePrice)
  if (property?.listingType === 'sale' && Number(property?.price) > 0) return Number(property.price)
  return 0
}

function formatDate(value) {
  if (!value) return 'Not specified'
  return new Date(value).toLocaleDateString('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function buildGallery(property) {
  const gallery = []
  if (property?.image) {
    gallery.push({
      url: property.image,
      isCover: true,
      sortOrder: -1
    })
  }

  if (Array.isArray(property?.images)) {
    property.images.forEach((item) => {
      if (!item?.url) return
      gallery.push({
        url: item.url,
        isCover: Boolean(item.isCover),
        sortOrder: item.sortOrder ?? 0
      })
    })
  }

  const seen = new Set()
  return gallery
    .filter((item) => {
      if (!item.url || seen.has(item.url)) return false
      seen.add(item.url)
      return true
    })
    .sort((first, second) => (first.sortOrder ?? 0) - (second.sortOrder ?? 0))
}

function FactCard({ label, value }) {
  return (
    <article className="property-fact-card">
      <span>{label}</span>
      <strong>{value || 'Not specified'}</strong>
    </article>
  )
}

function AmenityCard({ label }) {
  return (
    <article className="property-amenity-card">
      <div className="property-amenity-icon">{AMENITY_ICON_MAP[label] || '•'}</div>
      <strong>{label}</strong>
    </article>
  )
}

function DetailsRow({ label, value }) {
  if (!value && value !== 0) return null
  return (
    <div className="property-more-details-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export default function PropertyDetailsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { favoriteIds, toggleFavorite } = useFavorites()
  const { id } = useParams()
  const [property, setProperty] = useState(null)
  const [status, setStatus] = useState({ loading: true, error: '' })
  const [showInsights, setShowInsights] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [affordabilityState, setAffordabilityState] = useState({ loading: false, error: '', summary: null })
  const [contactState, setContactState] = useState({ loading: false, error: '' })
  const [actionMenuOpen, setActionMenuOpen] = useState(false)
  const [showSharedBoardModal, setShowSharedBoardModal] = useState(false)
  const [showARViewer, setShowARViewer] = useState(false)
  const [trustBadge, setTrustBadge] = useState(null)
  const [decisionMessage, setDecisionMessage] = useState({ type: '', text: '' })
  const insightsRef = useRef(null)
  const arViewerRef = useRef(null)

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const { data } = await api.get(`/properties/${id}`)
        setProperty(data.property)
        setStatus({ loading: false, error: '' })
      } catch (error) {
        setStatus({ loading: false, error: error.response?.data?.message || 'Failed to load property details.' })
      }
    }

    fetchProperty()
  }, [id])

  useEffect(() => {
    const saveRecentlyViewed = async () => {
      if (user?.role !== 'tenant' || !property?._id) return

      try {
        await api.post('/recently-viewed', { propertyId: property._id })
      } catch (error) {
        console.warn('Recently viewed save failed:', error.response?.data?.message || error.message)
      }
    }

    saveRecentlyViewed()
  }, [property?._id, user?.role])


  useEffect(() => {
    const fetchTrustBadge = async () => {
      if (!property?._id) return
      try {
        const { data } = await api.get(`/decision-hub/trust/${property._id}`)
        setTrustBadge(data)
      } catch (error) {
        setTrustBadge(null)
      }
    }

    fetchTrustBadge()
  }, [property?._id])

  useEffect(() => {
    if (!showInsights || !insightsRef.current) return
    insightsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [showInsights])

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    if (searchParams.get('ar') === '1') setShowARViewer(true)
  }, [location.search])

  useEffect(() => {
    if (!showARViewer || !arViewerRef.current) return
    arViewerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [showARViewer])

  useEffect(() => {
    const fetchAffordability = async () => {
      if (!id || user?.role !== 'tenant') return
      if (!property || property.listingType !== 'rent') {
        setAffordabilityState({ loading: false, error: '', summary: null })
        return
      }

      try {
        setAffordabilityState({ loading: true, error: '', summary: null })
        const { data } = await api.get(`/affordability/property/${id}`)
        setAffordabilityState({ loading: false, error: '', summary: data.summary })
      } catch (error) {
        setAffordabilityState({
          loading: false,
          error: error.response?.data?.message || 'Unable to compare this property yet.',
          summary: null
        })
      }
    }

    fetchAffordability()
  }, [id, property, user?.role])

  const gallery = useMemo(() => buildGallery(property), [property])
  const selectedImage = gallery[selectedImageIndex]?.url || property?.image || ''
  const lifestyleAmenities = useMemo(
    () => (property?.amenities || []).filter((item) => !['CCTV', '24/7 Security', 'Generator Backup', 'Intercom'].includes(item)),
    [property?.amenities]
  )
  const safetyAmenities = useMemo(
    () => (property?.amenities || []).filter((item) => ['CCTV', '24/7 Security', 'Generator Backup', 'Intercom'].includes(item)),
    [property?.amenities]
  )

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!lightboxOpen || !gallery.length) return
      if (event.key === 'Escape') setLightboxOpen(false)
      if (event.key === 'ArrowRight') setSelectedImageIndex((previous) => (previous + 1) % gallery.length)
      if (event.key === 'ArrowLeft') setSelectedImageIndex((previous) => (previous - 1 + gallery.length) % gallery.length)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gallery.length, lightboxOpen])

  const refreshAffordability = async () => {
    if (user?.role !== 'tenant' || property?.listingType !== 'rent') return

    try {
      setAffordabilityState((previous) => ({ ...previous, loading: true, error: '' }))
      const { data } = await api.get(`/affordability/property/${id}`)
      setAffordabilityState({ loading: false, error: '', summary: data.summary })
    } catch (error) {
      setAffordabilityState({
        loading: false,
        error: error.response?.data?.message || 'Unable to compare this property yet.',
        summary: null
      })
    }
  }

  const handleSave = async () => {
    if (!property) return
    await toggleFavorite(property._id)
  }

  const handleContactManager = async () => {
    if (!property?._id) return

    try {
      setContactState({ loading: true, error: '' })
      const { data } = await api.post('/chat/conversations', { propertyId: property._id })
      navigate(`/messages?conversation=${data.conversation._id}`)
    } catch (error) {
      setContactState({ loading: false, error: error.response?.data?.message || 'Unable to open chat right now.' })
      return
    }

    setContactState({ loading: false, error: '' })
  }


  const handleAddToCompare = async () => {
    if (!property?._id || user?.role !== 'tenant') return

    try {
      setDecisionMessage({ type: '', text: '' })
      const { data } = await api.patch(`/decision-hub/${property._id}/compare`, { compareSelected: true })
      setDecisionMessage({ type: 'success', text: data.message || 'Added to Decision Hub comparison.' })
    } catch (error) {
      setDecisionMessage({ type: 'error', text: error.response?.data?.message || 'Unable to add this property to comparison.' })
    }
  }

  const handleDecisionNoteSaved = (note) => {
    if (note?.compareSelected) {
      setDecisionMessage({ type: 'success', text: 'Decision note saved and comparison updated.' })
    } else {
      setDecisionMessage({ type: 'success', text: 'Decision note saved.' })
    }
  }

  const openInsights = () => setShowInsights(true)

  const availableActions = useMemo(() => ({
    rent: getRentPrice(property) > 0,
    lease: getRentPrice(property) > 0,
    buy: getSalePrice(property) > 0
  }), [property])

  const handlePropertyAction = (actionType) => {
    if (!property?._id || user?.role !== 'tenant') return
    setActionMenuOpen(false)
    navigate(`/properties/${property._id}/action?type=${actionType}`)
  }

  return (
    <>
      <Navbar />
      <div className="page-wrap details-wrap">
        <div className="details-stack property-details-layout">
          <div className="card details-card property-hero-card">
            {status.loading && <p>Loading property details...</p>}
            {status.error && <p className="error-text">{status.error}</p>}
            {property ? (
              <>
                <div className="property-hero-grid">
                  <div className="property-gallery-panel">
                    <button type="button" className="property-main-image-button" onClick={() => setLightboxOpen(true)}>
                      <img className="details-image property-main-image" src={selectedImage} alt={property.imageAlt || property.title} />
                    </button>
                    <div className="property-thumbnail-row">
                      {gallery.map((item, index) => (
                        <button
                          key={`${item.url}-${index}`}
                          type="button"
                          className={`property-thumbnail-btn ${selectedImageIndex === index ? 'active' : ''}`}
                          onClick={() => setSelectedImageIndex(index)}
                        >
                          <img src={item.url} alt={`${property.title} ${index + 1}`} className="property-thumbnail-image" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="details-panel property-hero-panel">
                    <div className="property-badge-row">
                      <span className="badge">{property.propertyType}</span>
                      <span className="badge listing-badge">{property.listingType === 'sale' ? 'Sale' : 'Rent'}</span>
                      <TrustBadge trust={trustBadge} property={property} compact />
                    </div>
                    <h1>{property.title}</h1>
                    <p className="details-price">{formatCurrency(property.price, property.listingType)}</p>
                    <p className="property-summary-text">{property.description}</p>
                    <div className="info-grid property-hero-info-grid">
                      <div><strong>Address:</strong> {property.location?.address}, {property.location?.area}, {property.location?.city}</div>
                      <div><strong>Bedrooms:</strong> {property.bedrooms}</div>
                      <div><strong>Bathrooms:</strong> {property.bathrooms}</div>
                      <div><strong>Total Size:</strong> {property.squareFeet} sqft</div>
                      <div><strong>Manager:</strong> {property.manager?.name || 'KeyCove Demo Manager'}</div>
                      <div><strong>Manager Email:</strong> {property.manager?.email || 'manager@keycove.demo'}</div>
                      <div><strong>Map Coordinates:</strong> {property.location?.latitude}, {property.location?.longitude}</div>
                    </div>
                    <div className="hero-actions property-hero-actions">
                      <Link to="/explore" className="secondary-btn">Back to Map</Link>
                      <a
                        className="primary-btn"
                        href={`https://www.openstreetmap.org/?mlat=${property.location?.latitude || 23.8103}&mlon=${property.location?.longitude || 90.4125}#map=16/${property.location?.latitude || 23.8103}/${property.location?.longitude || 90.4125}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open in Map
                      </a>
                      {user?.role === 'tenant' ? (
                        <button type="button" className="secondary-btn" onClick={() => setShowSharedBoardModal(true)}>
                          Shared Search
                        </button>
                      ) : null}
                      {user?.role === 'tenant' ? (
                        <>
                          <button type="button" className="secondary-btn" onClick={handleAddToCompare}>
                            Add to Compare
                          </button>
                          <Link to="/decision-hub" className="secondary-btn">Decision Hub</Link>
                        </>
                      ) : null}
                      <button type="button" className="primary-btn ar-view-button" onClick={() => setShowARViewer(true)}>Design Rooms</button>
                      <button type="button" className="secondary-btn" onClick={openInsights}>Neighbourhood Insights</button>
                      {user?.role === 'tenant' ? (
                        <>
                          <div className="property-action-menu-wrap">
                            <button type="button" className="primary-btn" onClick={() => setActionMenuOpen((previous) => !previous)}>
                              Take Action
                            </button>
                            {actionMenuOpen ? (
                              <div className="property-action-menu">
                                <button type="button" onClick={() => handlePropertyAction('rent')} disabled={!availableActions.rent}>Rent</button>
                                <button type="button" onClick={() => handlePropertyAction('lease')} disabled={!availableActions.lease}>Lease</button>
                                <button type="button" onClick={() => handlePropertyAction('buy')} disabled={!availableActions.buy}>Buy</button>
                              </div>
                            ) : null}
                          </div>
                          <button type="button" className="primary-btn" onClick={handleContactManager} disabled={contactState.loading}>
                            {contactState.loading ? 'Opening Chat...' : 'Contact Manager'}
                          </button>
                          <button type="button" className={`secondary-btn bookmark-btn ${favoriteIds.has(property._id) ? 'is-saved' : ''}`} onClick={handleSave}>
                            <span className="bookmark-btn-icon" aria-hidden="true">{favoriteIds.has(property._id) ? '★' : '☆'}</span>
                            <span>{favoriteIds.has(property._id) ? 'Saved' : 'Save'}</span>
                          </button>
                          <ReportListingButton property={property} />
                        </>
                      ) : null}
                    </div>
                    {contactState.error ? <p className="error-text">{contactState.error}</p> : null}
                    {decisionMessage.text ? <p className={decisionMessage.type === 'error' ? 'error-text' : 'success-text'}>{decisionMessage.text}</p> : null}
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {property ? (
            <>
              <section className="property-quick-facts-grid">
                <FactCard label="Bedrooms" value={property.bedrooms} />
                <FactCard label="Bathrooms" value={property.bathrooms} />
                <FactCard label="Size" value={`${property.squareFeet} sqft`} />
                <FactCard label="Property Type" value={property.propertyType} />
                <FactCard label="Sale / Rent" value={property.listingType === 'sale' ? 'Sale' : 'Rent'} />
                <FactCard label="Parking" value={property.amenities?.includes('Parking') ? 'Available' : 'Not listed'} />
                <FactCard label="Security" value={property.amenities?.some((item) => ['CCTV', '24/7 Security'].includes(item)) ? 'Available' : 'Not listed'} />
              </section>

              <section className="card property-section-card decision-tools-card">
                <div className="property-section-heading">
                  <p className="decision-eyebrow">KeyCove Decision Hub</p>
                  <h2>Decision Tools</h2>
                  <p>Inspect the listing quality, save private visit notes, and compare this property against your other shortlisted homes.</p>
                </div>
                <div className="decision-tools-grid">
                  <article className="decision-tool-info-card">
                    <span>Listing trust</span>
                    <TrustBadge trust={trustBadge} property={property} expandedDefault />
                    <p>This score rewards complete images, location, amenities, room dimensions, manager verification, and Design Rooms layout.</p>
                  </article>
                  <article className="decision-tool-info-card">
                    <span>Design Rooms connection</span>
                    <strong>{trustBadge?.hasDesignRoomsLayout ? 'Design Rooms Available' : 'No room design added yet'}</strong>
                    <p>{trustBadge?.hasDesignRoomsLayout ? 'This listing has room-planning assets that improve confidence before a visit.' : 'Managers can add room dimensions or staging layout to make this listing more trustworthy.'}</p>
                    <button type="button" className="secondary-btn" onClick={() => setShowARViewer(true)}>Open Design Rooms</button>
                  </article>
                </div>
                {user?.role === 'tenant' ? (
                  <DecisionNotePanel propertyId={property._id} onSaved={handleDecisionNoteSaved} />
                ) : (
                  <div className="decision-manager-note">
                    <strong>Manager view</strong>
                    <p>Improve this score by adding more images, full address details, amenities, room dimensions, and a tenant-facing Design Rooms layout. Tenant notes remain private.</p>
                  </div>
                )}
              </section>

              <section className="card property-section-card">
                <div className="property-section-heading">
                  <h2>About This Property</h2>
                  <p>Simple, readable details from your existing listing description.</p>
                </div>
                <p className="property-body-copy">{property.description}</p>
              </section>

              {showARViewer ? (
                <div ref={arViewerRef}>
                  <ARPropertyViewer property={property} user={user} onClose={() => setShowARViewer(false)} />
                </div>
              ) : null}

              <section className="card property-section-card">
                <div className="property-section-heading">
                  <h2>Amenities & Safety</h2>
                  <p>KeyCove presents the property highlights in an easy-to-scan premium layout.</p>
                </div>
                <div className="property-amenity-sections">
                  <div>
                    <h3 className="property-subsection-title">Lifestyle & Building Amenities</h3>
                    <div className="property-amenity-grid">
                      {lifestyleAmenities.length ? lifestyleAmenities.map((item) => <AmenityCard key={item} label={item} />) : <p className="muted-text">No lifestyle amenities listed yet.</p>}
                    </div>
                  </div>
                  <div>
                    <h3 className="property-subsection-title">Safety & Utilities</h3>
                    <div className="property-amenity-grid">
                      {safetyAmenities.length ? safetyAmenities.map((item) => <AmenityCard key={item} label={item} />) : <p className="muted-text">No safety or utility items listed yet.</p>}
                    </div>
                  </div>
                </div>
              </section>

              <section className="card property-section-card">
                <div className="property-section-heading">
                  <h2>More Details</h2>
                  <p>All useful stored property metadata that should be visible on the details page.</p>
                </div>
                <div className="property-more-details-grid">
                  <DetailsRow label="Property Type" value={property.propertyType} />
                  <DetailsRow label="Listing Type" value={property.listingType === 'sale' ? 'Sale' : 'Rent'} />
                  <DetailsRow label="Sale / Rent" value={property.listingType === 'sale' ? 'Sale' : 'Rent'} />
                  <DetailsRow label="Utilities Policy" value={property.policies?.utilities} />
                  <DetailsRow label="Pet Policy" value={property.policies?.pet} />
                  <DetailsRow label="Income Policy" value={property.policies?.income} />
                  <DetailsRow label="Total Size" value={`${property.squareFeet} sqft`} />
                  <DetailsRow label="City" value={property.location?.city} />
                  <DetailsRow label="Area / Neighborhood" value={property.location?.area} />
                  <DetailsRow label="Postal Code" value={property.location?.postalCode} />
                  <DetailsRow label="Available From" value={formatDate(property.availableFrom)} />
                  <DetailsRow label="School" value={property.nearbyPlaces?.school} />
                  <DetailsRow label="Bus" value={property.nearbyPlaces?.bus} />
                  <DetailsRow label="Restaurant" value={property.nearbyPlaces?.restaurant} />
                  <DetailsRow label="Latitude" value={property.location?.latitude} />
                  <DetailsRow label="Longitude" value={property.location?.longitude} />
                  <DetailsRow label="Address" value={property.location?.address} />
                  <DetailsRow label="Bedrooms" value={property.bedrooms} />
                  <DetailsRow label="Bathrooms" value={property.bathrooms} />
                  <DetailsRow label="Status" value={property.status} />
                  <DetailsRow label="Amenities" value={property.amenities?.join(', ')} />
                </div>
              </section>

              {user?.role === 'tenant' && property?.listingType === 'sale' ? (
                <section className="card property-section-card">
                  <div className="property-section-heading">
                    <h2>Mortgage & Ownership Cost</h2>
                    <p>This primary ownership tool is prefilled from the current sale listing so buyers can estimate monthly financing burden with context.</p>
                  </div>
                  <PropertyMortgageWidget property={property} />
                </section>
              ) : null}

              {user?.role === 'tenant' && property?.listingType === 'rent' ? (
                <section className="card property-section-card">
                  <div className="property-section-heading">
                    <h2>Rent Budget Check</h2>
                    <p>Affordability stays focused on rent suitability. Mortgage tools are intentionally hidden on rent listings.</p>
                  </div>
                  <PropertyAffordabilityWidget
                    summary={affordabilityState.summary}
                    loading={affordabilityState.loading}
                    error={affordabilityState.error}
                    onRefresh={refreshAffordability}
                  />
                  <div className="mortgage-relationship-note rent-only-note">
                    <h3>Ownership-only tool</h3>
                    <p>This listing is marked for rent, so the mortgage calculator is hidden here to avoid mixing rent affordability with buy-side financing.</p>
                  </div>
                </section>
              ) : null}

              {showInsights ? (
                <div ref={insightsRef}>
                  <NeighbourhoodInsightsSection property={property} />
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      {lightboxOpen && gallery.length ? (
        <div className="property-lightbox-backdrop" role="dialog" aria-modal="true">
          <div className="property-lightbox-card">
            <button type="button" className="property-lightbox-close" onClick={() => setLightboxOpen(false)}>✕</button>
            <button type="button" className="property-lightbox-arrow left" onClick={() => setSelectedImageIndex((previous) => (previous - 1 + gallery.length) % gallery.length)}>‹</button>
            <img src={selectedImage} alt={property?.title || 'Property gallery image'} className="property-lightbox-image" />
            <button type="button" className="property-lightbox-arrow right" onClick={() => setSelectedImageIndex((previous) => (previous + 1) % gallery.length)}>›</button>
          </div>
        </div>
      ) : null}

      {showSharedBoardModal && property ? (
        <BoardPickerModal
          property={property}
          onClose={() => setShowSharedBoardModal(false)}
        />
      ) : null}
    </>
  )
}
