import { Link } from 'react-router-dom'
import BookmarkButton from '../bookmarks/BookmarkButton'

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
  const handleSelect = () => {
    if (typeof onSelect === 'function') {
      onSelect(property)
    }
  }

  const handleToggleFavorite = (event) => {
    event.stopPropagation()
    onToggleFavorite?.(property._id)
  }

  return (
    <article className={`property-card ${compact ? 'compact' : ''} ${isActive ? 'active' : ''}`} onClick={handleSelect}>
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
          <Link to={`/properties/${property._id}`} className="primary-btn" onClick={(event) => event.stopPropagation()}>
            View Details
          </Link>
        </div>
      </div>
    </article>
  )
}
