import { Link } from 'react-router-dom'
import { formatCurrency, getPropertyImage, getVisitStatusLabel } from '../../lib/decisionHub'
import TrustBadge from './TrustBadge'

export default function ComparePropertyCard({ item, onRemove, onFinalChoice, onReject }) {
  const property = item.property || {}
  const note = item.note || {}

  return (
    <article className="compare-property-card">
      <img src={getPropertyImage(property)} alt={property.imageAlt || property.title || 'Property'} />
      <div className="compare-property-body">
        <div className="compare-card-topline">
          <span className="property-type-chip">{property.propertyType || 'Property'}</span>
          <TrustBadge trust={item.trustBadge} property={property} compact />
        </div>
        <h3>{property.title || 'Untitled property'}</h3>
        <strong>{formatCurrency(property.price, property.listingType)}</strong>
        <p>{property.bedrooms ?? '-'} bed • {property.bathrooms ?? '-'} bath • {property.squareFeet || '-'} sqft</p>
        <div className="compare-card-meta">
          <span>{getVisitStatusLabel(note.visitStatus)}</span>
          <span>{note.personalRating ? `${note.personalRating} ★` : 'No rating'}</span>
        </div>
        <div className="compare-card-actions">
          <Link to={`/properties/${property._id}`} className="secondary-btn">View Details</Link>
          <Link to={`/properties/${property._id}?ar=1`} className="secondary-btn">Design Rooms</Link>
          <button type="button" className="primary-btn" onClick={() => onFinalChoice?.(item)}>Final Choice</button>
          <button type="button" className="secondary-btn danger-btn" onClick={() => onReject?.(item)}>Reject</button>
          <button type="button" className="secondary-btn" onClick={() => onRemove?.(item)}>Remove</button>
        </div>
      </div>
    </article>
  )
}
