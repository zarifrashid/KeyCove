import { Link } from 'react-router-dom'

function formatCurrency(property) {
  const value = Number(property?.rentPrice || property?.salePrice || property?.price || 0)
  const amount = `৳ ${value.toLocaleString()}`
  return property?.listingType === 'rent' ? `${amount} / month` : amount
}

function formatAddress(property) {
  const parts = [property?.location?.address, property?.location?.area, property?.location?.city].filter(Boolean)
  return parts.length ? parts.join(', ') : 'Location not specified'
}

function formatViewedAt(value) {
  if (!value) return 'Recently viewed'
  return new Date(value).toLocaleString('en-BD', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

export default function RecentlyViewedCard({ item, onRemove }) {
  const property = item?.property
  if (!property) return null

  return (
    <article className="recently-viewed-card">
      <div className="recently-viewed-image-wrap">
        {property.image ? (
          <img src={property.image} alt={property.imageAlt || property.title} className="recently-viewed-image" />
        ) : (
          <div className="recently-viewed-image-placeholder">KeyCove</div>
        )}
      </div>
      <div className="recently-viewed-card-body">
        <div className="recently-viewed-card-topline">
          <span className="badge">{property.propertyType || 'Property'}</span>
          <span className="recently-viewed-time">Viewed {formatViewedAt(item.viewedAt)}</span>
        </div>
        <h3>{property.title || 'Untitled property'}</h3>
        <p className="recently-viewed-location">{formatAddress(property)}</p>
        <strong className="recently-viewed-price">{formatCurrency(property)}</strong>
        <div className="recently-viewed-meta">
          <span>{property.bedrooms ?? 0} beds</span>
          <span>{property.bathrooms ?? 0} baths</span>
          <span>{property.squareFeet ?? 0} sqft</span>
        </div>
        <div className="recently-viewed-actions">
          <Link to={`/properties/${property._id}`} className="primary-btn">View Details</Link>
          <button type="button" className="secondary-btn" onClick={() => onRemove(property._id)}>
            Remove
          </button>
        </div>
      </div>
    </article>
  )
}
