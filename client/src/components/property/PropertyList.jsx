import PropertyCard from './PropertyCard'

export default function PropertyList({ properties, selectedPropertyId, onSelectProperty, compact = false, emptyTitle = 'No properties found', emptyText = 'Try another search, adjust filters, or move the map.' }) {
  if (!properties.length) {
    return (
      <div className="empty-state compact-empty-state">
        <h3>{emptyTitle}</h3>
        <p>{emptyText}</p>
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
