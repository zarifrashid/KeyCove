import { Link } from 'react-router-dom'

function formatStatus(status) {
  if (!status) return 'Unknown'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export default function ManagerPropertyList({ properties, onDelete, deletingId }) {
  if (!properties.length) {
    return (
      <div className="manager-empty-state">
        <h3>No properties yet</h3>
        <p>Your published listings and drafts will appear here after you create them.</p>
      </div>
    )
  }

  return (
    <div className="manager-property-list">
      {properties.map((property) => (
        <article key={property._id} className="manager-property-card">
          <div className="manager-property-image-wrap">
            <img
              src={property.image || 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'}
              alt={property.imageAlt || property.title || 'Property photo'}
              className="manager-property-image"
            />
          </div>

          <div className="manager-property-content">
            <div className="manager-property-topline">
              <div>
                <div className={`manager-status-badge status-${property.status || 'unknown'}`}>
                  {formatStatus(property.status)}
                </div>
                <h3>{property.title || 'Untitled draft'}</h3>
                <p>
                  {property.location?.address || 'Address not set'}
                  {property.location?.area ? `, ${property.location.area}` : ''}
                  {property.location?.city ? `, ${property.location.city}` : ''}
                </p>
              </div>
              <strong>৳ {(property.price || 0).toLocaleString()}</strong>
            </div>

            <div className="manager-property-meta">
              <span>{property.propertyType || 'Property'}</span>
              <span>{property.listingType || 'rent'}</span>
              <span>{property.bedrooms ?? 0} bed</span>
              <span>{property.bathrooms ?? 0} bath</span>
              <span>{property.squareFeet ?? 0} sqft</span>
            </div>

            <div className="manager-property-actions">
              <Link to={`/properties/${property._id}/edit`} className="secondary-btn">
                Edit
              </Link>
              {property.status === 'active' ? (
                <Link to={`/properties/${property._id}`} className="secondary-btn">
                  View
                </Link>
              ) : null}
              <button
                type="button"
                className="danger-btn"
                disabled={deletingId === property._id}
                onClick={() => onDelete(property._id)}
              >
                {deletingId === property._id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
