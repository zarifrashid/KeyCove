import { Link } from 'react-router-dom'
import BookmarkButton from '../bookmarks/BookmarkButton'

export default function RecommendationCard({
  item,
  isSaved,
  onSaveToggle,
  onNotInterested,
  onTrackClick,
  bookmarkBusy = false,
  showSeeMoreLink = false
}) {
  const property = item.property

  return (
    <article className="recommendation-card">
      <img className="recommendation-card-image" src={property.image} alt={property.imageAlt} />
      <div className="recommendation-card-body">
        <div className="recommendation-topline">
          <span className="property-type-chip">{property.propertyType}</span>
          <strong>৳ {property.price.toLocaleString()}</strong>
        </div>

        <div className="recommendation-meta-row">
          {item.matchLabel ? <span className="recommendation-match-chip">{item.matchLabel}</span> : null}
          <span className="recommendation-mode-chip">{property.listingType === 'sale' ? 'Buy' : 'Rent'}</span>
        </div>

        {item.badges?.length ? (
          <div className="recommendation-badge-row">
            {item.badges.map((badge) => (
              <span key={badge} className="recommendation-pill">{badge}</span>
            ))}
          </div>
        ) : null}

        <h3>{property.title}</h3>
        <p className="property-location">{property.location.area}, {property.location.city}</p>
        <p className="property-summary">{property.bedrooms} bed • {property.bathrooms} bath • {property.squareFeet} sqft • {property.listingType}</p>
        <p className="recommendation-reason">Why this property? {item.reason}</p>

        {item.whyThisProperty?.length ? (
          <div className="why-chip-row">
            {item.whyThisProperty.map((chip) => (
              <span key={chip} className="why-chip">{chip}</span>
            ))}
          </div>
        ) : null}

        <div className="recommendation-actions">
          <Link
            to={`/properties/${property._id}`}
            className="primary-btn"
            onClick={() => onTrackClick(item)}
          >
            View Property
          </Link>
          <BookmarkButton
            isSaved={isSaved}
            onToggle={() => onSaveToggle(item)}
            busy={bookmarkBusy}
          />
          <button type="button" className="secondary-btn ghost-btn" onClick={() => onNotInterested(item)}>
            Not Interested
          </button>
          {showSeeMoreLink ? <Link to="/recommendations" className="secondary-btn">See More</Link> : null}
        </div>
      </div>
    </article>
  )
}
