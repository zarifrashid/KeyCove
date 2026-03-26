import { Link } from 'react-router-dom'
import BookmarkButton from './BookmarkButton'

function formatPrice(price, listingType) {
  const amount = `৳ ${Number(price || 0).toLocaleString()}`
  return listingType === 'rent' ? `${amount} / month` : amount
}

export default function SavedPropertiesSection({ favorites, favoriteIds, onToggleFavorite, pendingPropertyIds }) {
  return (
    <section className="card saved-properties-section">
      <div className="saved-properties-header">
        <div>
          <p className="badge">Bookmarks</p>
          <h2>Saved Properties</h2>
          <p>Review the homes you shortlisted and remove any property when your preferences change.</p>
        </div>
        <div className="saved-properties-count">{favorites.length} saved</div>
      </div>

      {!favorites.length ? (
        <div className="empty-state saved-properties-empty-state">
          <h3>No saved properties yet</h3>
          <p>Browse listings and use Save to build a shortlist in your dashboard.</p>
          <Link to="/explore" className="primary-btn">Explore Properties</Link>
        </div>
      ) : (
        <div className="saved-properties-grid">
          {favorites.map((favorite) => {
            const property = favorite.property
            if (!property) return null

            return (
              <article key={favorite._id || property._id} className="saved-property-card">
                <img
                  className="saved-property-image"
                  src={property.image}
                  alt={property.imageAlt || property.title}
                />
                <div className="saved-property-body">
                  <div className="saved-property-topline">
                    <span className="property-type-chip">{property.propertyType}</span>
                    <strong>{formatPrice(property.price, property.listingType)}</strong>
                  </div>
                  <h3>{property.title}</h3>
                  <p className="property-location">{property.location?.address}, {property.location?.area}, {property.location?.city}</p>
                  <p className="property-summary">{property.bedrooms} bed • {property.bathrooms} bath • {property.squareFeet} sqft • {property.listingType}</p>
                  <p className="saved-property-meta">Saved on {new Date(favorite.createdAt).toLocaleDateString('en-BD')}</p>
                  <div className="saved-property-actions">
                    <Link to={`/properties/${property._id}`} className="primary-btn">View Details</Link>
                    <BookmarkButton
                      isSaved={favoriteIds.has(property._id)}
                      onToggle={() => onToggleFavorite(property._id)}
                      loading={pendingPropertyIds.has(property._id)}
                    />
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
