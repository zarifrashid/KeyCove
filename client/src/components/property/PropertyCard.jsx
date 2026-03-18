import { Link } from 'react-router-dom'

export default function PropertyCard({ property, isActive, onSelect }) {
  return (
    <article className={`property-card ${isActive ? 'active' : ''}`} onClick={() => onSelect(property)}>
      <img className="property-card-image" src={property.image} alt={property.imageAlt} />
      <div className="property-card-body">
        <div className="property-card-topline">
          <span className="property-type-chip">{property.propertyType}</span>
          <strong>৳ {property.price.toLocaleString()}</strong>
        </div>
        <h3>{property.title}</h3>
        <p className="property-location">{property.location.address}, {property.location.area}, {property.location.city}</p>
        <p className="property-summary">{property.bedrooms} bed • {property.bathrooms} bath • {property.squareFeet} sqft • {property.listingType}</p>
        <div className="amenity-preview-row">
          {property.amenities?.slice(0, 3).map((amenity) => (
            <span key={amenity} className="mini-amenity-chip">{amenity}</span>
          ))}
        </div>
        <div className="property-card-actions">
          <button type="button" className="secondary-btn" onClick={(event) => { event.stopPropagation(); onSelect(property) }}>
            Open in Map
          </button>
          <Link to={`/properties/${property._id}`} className="primary-btn" onClick={(event) => event.stopPropagation()}>
            View Details
          </Link>
        </div>
      </div>
    </article>
  )
}
