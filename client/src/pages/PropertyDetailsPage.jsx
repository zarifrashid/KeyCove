import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import NeighbourhoodInsightsSection from '../components/neighbourhood/NeighbourhoodInsightsSection'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import useFavorites from '../hooks/useFavorites'
<<<<<<< HEAD
import BookmarkButton from '../components/bookmarks/BookmarkButton'
=======
>>>>>>> origin/main
import PropertyAffordabilityWidget from '../components/affordability/PropertyAffordabilityWidget'

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
<<<<<<< HEAD
  const { favoriteIds, toggleFavorite, pendingPropertyIds } = useFavorites()
=======
  const { favoriteIds, saveFavorite } = useFavorites()
>>>>>>> origin/main
  const { id } = useParams()
  const [property, setProperty] = useState(null)
  const [status, setStatus] = useState({ loading: true, error: '' })
  const [showInsights, setShowInsights] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [affordabilityState, setAffordabilityState] = useState({ loading: false, error: '', summary: null })
  const insightsRef = useRef(null)

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
    if (!showInsights || !insightsRef.current) return
    insightsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [showInsights])

  useEffect(() => {
    const fetchAffordability = async () => {
      if (!id || user?.role !== 'tenant') return

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
  }, [id, user?.role])

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
    if (user?.role !== 'tenant') return

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
<<<<<<< HEAD
    await toggleFavorite(property._id)
=======
    await saveFavorite(property._id)
>>>>>>> origin/main
  }

  const openInsights = () => setShowInsights(true)

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
                    </div>
                    <h1>{property.title}</h1>
                    <p className="details-price">{formatCurrency(property.price, property.listingType)}</p>
                    <p className="property-summary-text">{property.description}</p>
                    <div className="info-grid property-hero-info-grid">
                      <div><strong>Address:</strong> {property.location.address}, {property.location.area}, {property.location.city}</div>
                      <div><strong>Bedrooms:</strong> {property.bedrooms}</div>
                      <div><strong>Bathrooms:</strong> {property.bathrooms}</div>
                      <div><strong>Total Size:</strong> {property.squareFeet} sqft</div>
                      <div><strong>Manager:</strong> {property.manager?.name || 'KeyCove Demo Manager'}</div>
                      <div><strong>Manager Email:</strong> {property.manager?.email || 'manager@keycove.demo'}</div>
                      <div><strong>Map Coordinates:</strong> {property.location.latitude}, {property.location.longitude}</div>
                    </div>
                    <div className="hero-actions property-hero-actions">
                      <Link to="/explore" className="secondary-btn">Back to Map</Link>
                      <a
                        className="primary-btn"
                        href={`https://www.openstreetmap.org/?mlat=${property.location.latitude}&mlon=${property.location.longitude}#map=16/${property.location.latitude}/${property.location.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open in Map
                      </a>
                      <button type="button" className="secondary-btn" onClick={openInsights}>Neighbourhood Insights</button>
                      {user?.role === 'tenant' ? (
<<<<<<< HEAD
                        <BookmarkButton
                          isSaved={favoriteIds.has(property._id)}
                          onToggle={handleSave}
                          loading={pendingPropertyIds.has(property._id)}
                        />
=======
                        <button type="button" className="secondary-btn" onClick={handleSave} disabled={favoriteIds.has(property._id)}>
                          {favoriteIds.has(property._id) ? 'Saved' : 'Save'}
                        </button>
>>>>>>> origin/main
                      ) : null}
                    </div>
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

              <section className="card property-section-card">
                <div className="property-section-heading">
                  <h2>About This Property</h2>
                  <p>Simple, readable details from your existing listing description.</p>
                </div>
                <p className="property-body-copy">{property.description}</p>
              </section>

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

              {user?.role === 'tenant' ? (
                <section className="card property-section-card">
                  <div className="property-section-heading">
                    <h2>Mortgage & Affordability</h2>
                    <p>The existing affordability tools stay intact and now sit inside a cleaner dedicated section.</p>
                  </div>
                  <PropertyAffordabilityWidget
                    summary={affordabilityState.summary}
                    loading={affordabilityState.loading}
                    error={affordabilityState.error}
                    onRefresh={refreshAffordability}
                  />
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
    </>
  )
}
