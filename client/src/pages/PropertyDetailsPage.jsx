import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import NeighbourhoodInsightsSection from '../components/neighbourhood/NeighbourhoodInsightsSection'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import useFavorites from '../hooks/useFavorites'
import PropertyAffordabilityWidget from '../components/affordability/PropertyAffordabilityWidget'
import PropertyMortgageWidget from '../components/mortgage/PropertyMortgageWidget'

export default function PropertyDetailsPage() {
  const { user } = useAuth()
  const { favoriteIds, saveFavorite } = useFavorites()
  const { id } = useParams()
  const [property, setProperty] = useState(null)
  const [status, setStatus] = useState({ loading: true, error: '' })
  const [showInsights, setShowInsights] = useState(false)
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
    await saveFavorite(property._id)
  }

  return (
    <>
      <Navbar />
      <div className="page-wrap details-wrap">
        <div className="details-stack">
          <div className="card details-card">
            {status.loading && <p>Loading property details...</p>}
            {status.error && <p className="error-text">{status.error}</p>}
            {property && (
              <>
                <div className="details-grid">
                  <img className="details-image" src={property.image} alt={property.imageAlt} />
                  <div className="details-panel">
                    <span className="badge">{property.propertyType}</span>
                    <h1>{property.title}</h1>
                    <p className="details-price">৳ {property.price.toLocaleString()}{property.listingType === 'rent' ? ' / month' : ''}</p>
                    <p>{property.description}</p>
                    <div className="info-grid">
                      <div><strong>Address:</strong> {property.location.address}, {property.location.area}, {property.location.city}</div>
                      <div><strong>Bedrooms:</strong> {property.bedrooms}</div>
                      <div><strong>Bathrooms:</strong> {property.bathrooms}</div>
                      <div><strong>Size:</strong> {property.squareFeet} sqft</div>
                      <div><strong>Manager:</strong> {property.manager?.name || 'KeyCove Demo Manager'}</div>
                      <div><strong>Manager Email:</strong> {property.manager?.email || 'manager@keycove.demo'}</div>
                      <div><strong>Map Coordinates:</strong> {property.location.latitude}, {property.location.longitude}</div>
                      <div><strong>Amenities:</strong> {property.amenities?.join(', ')}</div>
                    </div>
                    {user?.role === 'tenant' ? (
                      <PropertyAffordabilityWidget
                        summary={affordabilityState.summary}
                        loading={affordabilityState.loading}
                        error={affordabilityState.error}
                        onRefresh={refreshAffordability}
                      />
                    ) : null}
                    <PropertyMortgageWidget property={property} />
                    <div className="hero-actions">
                      <Link to="/explore" className="secondary-btn">Back to Map</Link>
                      <a
                        className="primary-btn"
                        href={`https://www.openstreetmap.org/?mlat=${property.location.latitude}&mlon=${property.location.longitude}#map=16/${property.location.latitude}/${property.location.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open in Map
                      </a>
                      {user?.role === 'tenant' ? (
                        <button type="button" className="secondary-btn" onClick={handleSave} disabled={favoriteIds.has(property._id)}>
                          {favoriteIds.has(property._id) ? 'Saved' : 'Save'}
                        </button>
                      ) : null}
                      <button type="button" className="secondary-btn" onClick={() => setShowInsights(true)}>
                        Neighbourhood Insights
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {property && showInsights ? (
            <div ref={insightsRef}>
              <NeighbourhoodInsightsSection property={property} />
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
