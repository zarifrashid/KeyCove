import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { api } from '../lib/api'

export default function PropertyDetailsPage() {
  const { id } = useParams()
  const [property, setProperty] = useState(null)
  const [status, setStatus] = useState({ loading: true, error: '' })

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

  return (
    <>
      <Navbar />
      <div className="page-wrap details-wrap">
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
                  <p className="details-price">৳ {property.price.toLocaleString()} / month</p>
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
                  <div className="hero-actions">
                    <Link to="/" className="secondary-btn">Back to Map</Link>
                    <a
                      className="primary-btn"
                      href={`https://www.openstreetmap.org/?mlat=${property.location.latitude}&mlon=${property.location.longitude}#map=16/${property.location.latitude}/${property.location.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open in Map
                    </a>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
