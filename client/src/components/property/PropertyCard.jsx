import { Link } from 'react-router-dom'
<<<<<<< HEAD
import { useAuth } from '../../context/AuthContext'
import BookmarkButton from '../bookmarks/BookmarkButton'

export default function PropertyCard({
  property,
  isActive,
  onSelect,
  compact = false,
  isSaved = false,
  isSaving = false,
  onToggleFavorite
}) {
  const { user } = useAuth()
  const isTenant = user?.role === 'tenant'

  const handleToggleFavorite = async (event) => {
    event.stopPropagation()
    if (!onToggleFavorite) return
    await onToggleFavorite(property._id)
  }

=======

export default function PropertyCard({ property, isActive, onSelect, compact = false }) {
>>>>>>> origin/main
  return (
    <article className={`property-card ${compact ? 'compact' : ''} ${isActive ? 'active' : ''}`} onClick={() => onSelect(property)}>
      <img className="property-card-image" src={property.image} alt={property.imageAlt} />
      <div className="property-card-body">
        <div className="property-card-topline">
          <span className="property-type-chip">{property.propertyType}</span>
          <strong>৳ {property.price.toLocaleString()}</strong>
        </div>
        <div className="property-card-title-row">
          <h3>{property.title}</h3>
          {property.affordabilityLabel ? <span className={`affordability-inline-pill ${property.affordabilityCategory || ''}`}>{property.affordabilityLabel}</span> : null}
        </div>
        <p className="property-location">{property.location.address}, {property.location.area}, {property.location.city}</p>
        <p className="property-summary">{property.bedrooms} bed • {property.bathrooms} bath • {property.squareFeet} sqft • {property.listingType}</p>
        <div className="amenity-preview-row">
          {property.amenities?.slice(0, compact ? 2 : 3).map((amenity) => (
            <span key={amenity} className="mini-amenity-chip">{amenity}</span>
          ))}
        </div>
        <div className="property-card-actions compact-actions">
          <button type="button" className="secondary-btn" onClick={(event) => { event.stopPropagation(); onSelect(property) }}>
            Open in Map
          </button>
          <Link to={`/properties/${property._id}`} className="primary-btn" onClick={(event) => event.stopPropagation()}>
            View Details
          </Link>
<<<<<<< HEAD
          {isTenant ? (
            <BookmarkButton
              isSaved={isSaved}
              onToggle={handleToggleFavorite}
              loading={isSaving}
              compact={compact}
            />
          ) : null}
=======
>>>>>>> origin/main
        </div>
      </div>
    </article>
  )
}
