<<<<<<< HEAD
import BookmarkButton from '../bookmarks/BookmarkButton'
import { Link } from 'react-router-dom'

export default function RecommendationCard({ item, isSaved, onSave, onNotInterested, onTrackClick, isSaving = false }) {
=======
import { Link } from 'react-router-dom'

export default function RecommendationCard({ item, isSaved, onSave, onNotInterested, onTrackClick }) {
>>>>>>> origin/main
  const property = item.property

  return (
    <article className="recommendation-card">
      <img className="recommendation-card-image" src={property.image} alt={property.imageAlt} />
      <div className="recommendation-card-body">
        <div className="recommendation-topline">
          <span className="property-type-chip">{property.propertyType}</span>
          <strong>৳ {property.price.toLocaleString()}</strong>
        </div>
        <h3>{property.title}</h3>
        <p className="property-location">{property.location.area}, {property.location.city}</p>
        <p className="property-summary">{property.bedrooms} bed • {property.bathrooms} bath • {property.squareFeet} sqft • {property.listingType}</p>
        <p className="recommendation-reason">{item.reason}</p>
        <div className="recommendation-actions">
          <Link
            to={`/properties/${property._id}`}
            className="primary-btn"
            onClick={() => onTrackClick(item)}
          >
            View Property
          </Link>
<<<<<<< HEAD
          <BookmarkButton
            isSaved={isSaved}
            onToggle={() => onSave(item)}
            loading={isSaving}
          />
=======
          <button type="button" className="secondary-btn" onClick={() => onSave(item)} disabled={isSaved}>
            {isSaved ? 'Saved' : 'Save'}
          </button>
>>>>>>> origin/main
          <button type="button" className="secondary-btn ghost-btn" onClick={() => onNotInterested(item)}>
            Not Interested
          </button>
          <Link to="/recommendations" className="secondary-btn">See More</Link>
        </div>
      </div>
    </article>
  )
}
