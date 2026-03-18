function buildChips(filters) {
  const chips = []

  if (filters.search) chips.push({ key: 'search', label: `Search: ${filters.search}` })
  if (filters.area && filters.area !== 'All') chips.push({ key: 'area', label: `Area: ${filters.area}` })
  if (filters.minPrice) chips.push({ key: 'minPrice', label: `Min ৳${filters.minPrice}` })
  if (filters.maxPrice) chips.push({ key: 'maxPrice', label: `Max ৳${filters.maxPrice}` })
  if (filters.minBeds) chips.push({ key: 'minBeds', label: `${filters.minBeds}+ beds` })
  if (filters.maxBeds) chips.push({ key: 'maxBeds', label: `Up to ${filters.maxBeds} beds` })
  if (filters.minBaths) chips.push({ key: 'minBaths', label: `${filters.minBaths}+ baths` })
  if (filters.maxBaths) chips.push({ key: 'maxBaths', label: `Up to ${filters.maxBaths} baths` })
  if (filters.minSquareFeet) chips.push({ key: 'minSquareFeet', label: `${filters.minSquareFeet}+ sqft` })
  if (filters.maxSquareFeet) chips.push({ key: 'maxSquareFeet', label: `Up to ${filters.maxSquareFeet} sqft` })
  if (filters.propertyType.length) chips.push({ key: 'propertyType', label: `Type: ${filters.propertyType.join(', ')}` })
  if (filters.listingType.length) chips.push({ key: 'listingType', label: `Listing: ${filters.listingType.join(', ')}` })
  filters.amenities.forEach((amenity) => chips.push({ key: `amenity-${amenity}`, label: amenity }))
  if (filters.availableFrom) chips.push({ key: 'availableFrom', label: `Available by ${filters.availableFrom}` })
  if (filters.postedAfter) chips.push({ key: 'postedAfter', label: `Posted after ${filters.postedAfter}` })
  if (filters.sort && filters.sort !== 'newest') chips.push({ key: 'sort', label: `Sort: ${filters.sort}` })

  return chips
}

export default function ActiveFilterChips({ filters }) {
  const chips = buildChips(filters)

  if (!chips.length) {
    return null
  }

  return (
    <div className="active-filter-strip">
      {chips.map((chip) => (
        <span key={chip.key} className="active-filter-chip">{chip.label}</span>
      ))}
    </div>
  )
}
