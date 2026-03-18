import PropertyCard from './PropertyCard'

export default function PropertyList({ properties, selectedPropertyId, onSelectProperty, compact = false }) {
  if (!properties.length) {
    return (
      <div className="empty-state compact-empty-state">
        <h3>No properties found</h3>
        <p>Try another search, adjust filters, or move the map.</p>
      </div>
    )
  }

  return (
    <div className={`property-list ${compact ? 'compact' : ''}`}>
      {properties.map((property) => (
        <PropertyCard
          key={property._id}
          property={property}
          isActive={selectedPropertyId === property._id}
          onSelect={onSelectProperty}
          compact={compact}
        />
      ))}
    </div>
  )
}
