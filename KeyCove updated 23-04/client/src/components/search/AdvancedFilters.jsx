import SortDropdown from './SortDropdown'

const PROPERTY_TYPES = ['Apartment', 'Condo', 'Studio', 'Family Home']
const LISTING_TYPES = ['rent', 'sale']
const AMENITIES = ['Lift', 'Parking', '24/7 Security', 'Generator Backup', 'Gym Access', 'Rooftop Garden', 'Community Hall', 'CCTV']

function toggleArrayValue(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

export default function AdvancedFilters({
  filters,
  onChange,
  onApply,
  onReset,
  onSortChange,
  compact = false
}) {
  const updateValue = (key, value) => onChange((previous) => ({ ...previous, [key]: value }))

  const toggleAmenity = (amenity) => {
    onChange((previous) => ({
      ...previous,
      amenities: toggleArrayValue(previous.amenities, amenity)
    }))
  }

  const togglePropertyType = (propertyType) => {
    onChange((previous) => ({
      ...previous,
      propertyType: toggleArrayValue(previous.propertyType, propertyType)
    }))
  }

  const toggleListingType = (listingType) => {
    onChange((previous) => ({
      ...previous,
      listingType: toggleArrayValue(previous.listingType, listingType)
    }))
  }

  const getDisplayValue = (value) => value || ''

  return (
    <section className={`advanced-filters ${compact ? 'compact-panel' : 'card'}`}>
      {!compact && (
        <div className="section-heading-row">
          <div>
            <span className="badge">Feature 3 • Sorting Engine</span>
            <h2>Filter and sort using the backend query engine</h2>
            <p>Price, beds, baths, square feet, amenities, listing type, and sorting all run through the server-side property search flow.</p>
          </div>
          <div className="filter-action-row">
            <button type="button" className="primary-btn" onClick={onApply}>Apply Filters</button>
            <button type="button" className="secondary-btn" onClick={onReset}>Reset Filters</button>
          </div>
        </div>
      )}

      {compact && (
        <div className="compact-filter-actions">
          <button type="button" className="primary-btn" onClick={onApply}>Apply Filters</button>
          <button type="button" className="secondary-btn" onClick={onReset}>Reset Filters</button>
        </div>
      )}

      <div className={`advanced-filter-grid ${compact ? 'compact' : ''}`}>
        <label>
          <span>Min Price</span>
          <input type="number" min="0" value={getDisplayValue(filters.minPrice)} onChange={(event) => updateValue('minPrice', event.target.value)} placeholder="e.g. 25000" />
        </label>
        <label>
          <span>Max Price</span>
          <input type="number" min="0" value={getDisplayValue(filters.maxPrice)} onChange={(event) => updateValue('maxPrice', event.target.value)} placeholder="e.g. 80000" />
        </label>
        <label>
          <span>Min Beds</span>
          <input type="number" min="0" value={getDisplayValue(filters.minBeds)} onChange={(event) => updateValue('minBeds', event.target.value)} placeholder="e.g. 1" />
        </label>
        <label>
          <span>Max Beds</span>
          <input type="number" min="0" value={getDisplayValue(filters.maxBeds)} onChange={(event) => updateValue('maxBeds', event.target.value)} placeholder="e.g. 4" />
        </label>
        <label>
          <span>Min Baths</span>
          <input type="number" min="0" value={getDisplayValue(filters.minBaths)} onChange={(event) => updateValue('minBaths', event.target.value)} placeholder="e.g. 1" />
        </label>
        <label>
          <span>Max Baths</span>
          <input type="number" min="0" value={getDisplayValue(filters.maxBaths)} onChange={(event) => updateValue('maxBaths', event.target.value)} placeholder="e.g. 3" />
        </label>
        <label>
          <span>Min Area</span>
          <input type="number" min="0" value={getDisplayValue(filters.minSquareFeet)} onChange={(event) => updateValue('minSquareFeet', event.target.value)} placeholder="e.g. 850" />
        </label>
        <label>
          <span>Max Area</span>
          <input type="number" min="0" value={getDisplayValue(filters.maxSquareFeet)} onChange={(event) => updateValue('maxSquareFeet', event.target.value)} placeholder="e.g. 1800" />
        </label>
        <label>
          <span>Available Before</span>
          <input type="date" value={filters.availableFrom} onChange={(event) => updateValue('availableFrom', event.target.value)} />
        </label>
        <label>
          <span>Posted After</span>
          <input type="date" value={filters.postedAfter} onChange={(event) => updateValue('postedAfter', event.target.value)} />
        </label>
      </div>

      <div className={`filter-chip-section ${compact ? 'compact' : ''}`}>
        <div>
          <h3>Property Type</h3>
          <div className="quick-filters compact-chips">
            {PROPERTY_TYPES.map((propertyType) => (
              <button
                key={propertyType}
                type="button"
                className={`chip-button ${filters.propertyType.includes(propertyType) ? 'active' : ''}`}
                onClick={() => togglePropertyType(propertyType)}
              >
                {propertyType}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3>Listing Type</h3>
          <div className="quick-filters compact-chips">
            {LISTING_TYPES.map((listingType) => (
              <button
                key={listingType}
                type="button"
                className={`chip-button ${filters.listingType.includes(listingType) ? 'active' : ''}`}
                onClick={() => toggleListingType(listingType)}
              >
                {listingType}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3>Amenities</h3>
          <div className="quick-filters compact-chips">
            {AMENITIES.map((amenity) => (
              <button
                key={amenity}
                type="button"
                className={`chip-button ${filters.amenities.includes(amenity) ? 'active' : ''}`}
                onClick={() => toggleAmenity(amenity)}
              >
                {amenity}
              </button>
            ))}
          </div>
        </div>

        <div className="sorting-section">
          <h3>Sorting</h3>
          <p className="sorting-helper-text">Choose how filtered properties should be ordered in the results panel.</p>
          <SortDropdown value={filters.sort} onChange={onSortChange} compact />
        </div>
      </div>
    </section>
  )
}
