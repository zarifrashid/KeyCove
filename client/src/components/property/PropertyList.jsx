import PropertyCard from './PropertyCard'

export default function PropertyList({ properties, selectedPropertyId, onSelectProperty }) {
  if (!properties.length) {
    return (
      <div className="empty-state">
        <h3>No properties found</h3>
        <p>Try another area, move the map, or reset the search.</p>
      </div>
    )
  }

  return (
    <div className="property-list">
      {properties.map((property) => (
        <PropertyCard
          key={property._id}
          property={property}
          isActive={selectedPropertyId === property._id}
          onSelect={onSelectProperty}
        />
      ))}
    </div>
  )
}
