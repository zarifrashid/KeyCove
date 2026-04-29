import { useState } from 'react'
import { Link } from 'react-router-dom'
import BookmarkButton from '../bookmarks/BookmarkButton'
import TrustBadge from '../decisionHub/TrustBadge'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { getPropertyImage } from '../../lib/decisionHub'

export default function PropertyCard({
  property,
  isActive,
  onSelect,
  compact = false,
  isSaved = false,
  onToggleFavorite = null,
  bookmarkBusy = false,
  bookmarkSavedLabel = 'Saved'
}) {
  const { user } = useAuth()
  const [compareState, setCompareState] = useState({ loading: false, message: '', added: false })

  const handleSelect = () => {
    if (typeof onSelect === 'function') {
      onSelect(property)
    }
  }

  const handleToggleFavorite = (event) => {
    event.stopPropagation()
    onToggleFavorite?.(property._id)
  }

  const handleAddToCompare = async (event) => {
    event.stopPropagation()
    if (!property?._id || user?.role !== 'tenant') return
    try {
      setCompareState({ loading: true, message: '', added: compareState.added })
      const { data } = await api.patch(`/decision-hub/${property._id}/compare`, { compareSelected: true })
      setCompareState({ loading: false, message: data.message || 'Added to Decision Hub.', added: true })
    } catch (error) {
      setCompareState({ loading: false, message: error.response?.data?.message || 'Unable to add to comparison.', added: false })
    }
  }

  return (
    <article className={`property-card ${compact ? 'compact' : ''} ${isActive ? 'active' : ''}`} onClick={handleSelect}>
      <img className="property-card-image" src={getPropertyImage(property)} alt={property.imageAlt || property.title || 'Property'} />
      <div className="property-card-body">
        <div className="property-card-topline">
          <span className="property-type-chip">{property.propertyType}</span>
          <strong>৳ {Number(property.price || 0).toLocaleString()}</strong>
        </div>
        <div className="property-card-title-row">
          <h3>{property.title}</h3>
          {property.affordabilityLabel ? <span className={`affordability-inline-pill ${property.affordabilityCategory || ''}`}>{property.affordabilityLabel}</span> : null}
        </div>
        <p className="property-location">{[property.location?.address, property.location?.area, property.location?.city].filter(Boolean).join(', ') || 'Location not listed'}</p>
        <p className="property-summary">{property.bedrooms} bed • {property.bathrooms} bath • {property.squareFeet} sqft • {property.listingType}</p>
        <div className="property-card-trust-row">
          <TrustBadge property={property} compact />
        </div>
        <div className="amenity-preview-row">
          {property.amenities?.slice(0, compact ? 2 : 3).map((amenity) => (
            <span key={amenity} className="mini-amenity-chip">{amenity}</span>
          ))}
        </div>
        {compareState.message ? <p className={`decision-card-message ${compareState.added ? 'success-text' : 'error-text'}`}>{compareState.message}</p> : null}
        <div className="property-card-actions compact-actions">
          <button type="button" className="secondary-btn" onClick={(event) => { event.stopPropagation(); handleSelect() }}>
            Open in Map
          </button>
          {onToggleFavorite ? (
            <BookmarkButton
              isSaved={isSaved}
              onToggle={handleToggleFavorite}
              busy={bookmarkBusy}
              savedLabel={bookmarkSavedLabel}
            />
          ) : null}
          {user?.role === 'tenant' ? (
            <button type="button" className="secondary-btn" onClick={handleAddToCompare} disabled={compareState.loading}>
              {compareState.loading ? 'Adding...' : compareState.added ? 'In Compare' : 'Compare'}
            </button>
          ) : null}
          <Link to={`/properties/${property._id}?ar=1`} className="secondary-btn ar-card-btn" onClick={(event) => event.stopPropagation()}>
            Design Rooms
          </Link>
          <Link to={`/properties/${property._id}`} className="primary-btn" onClick={(event) => event.stopPropagation()}>
            View Details
          </Link>
        </div>
      </div>
    </article>
  )
}
