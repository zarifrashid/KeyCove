const PROPERTY_TYPES = ['Apartment', 'Condo', 'Studio', 'Family Home']
const LISTING_TYPES = ['rent', 'sale']
const AMENITIES = ['Lift', 'Parking', '24/7 Security', 'Generator Backup', 'Gym Access', 'Rooftop Garden', 'Community Hall', 'CCTV']

function toggleArrayValue(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

export default function AdvancedFilters({ filters, onChange, onApply, onReset }) {
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

  return (
    <section className="advanced-filters card">
      <div className="section-heading-row">
        <div>
          <span className="badge">Feature 2 • Advanced Server-Side Search Engine</span>
          <h2>Filter on the server, not just in the browser</h2>
          <p>Price, beds, baths, square feet, amenities, listing type, and sorting all run through the backend query engine.</p>
        </div>
        <div className="filter-action-row">
          <button type="button" className="primary-btn" onClick={onApply}>Apply Filters</button>
          <button type="button" className="secondary-btn" onClick={onReset}>Reset Filters</button>
        </div>
      </div>

      <div className="advanced-filter-grid">
        <label>
          <span>Minimum Price</span>
          <input type="number" min="0" value={filters.minPrice} onChange={(event) => updateValue('minPrice', event.target.value)} placeholder="e.g. 25000" />
        </label>
        <label>
          <span>Maximum Price</span>
          <input type="number" min="0" value={filters.maxPrice} onChange={(event) => updateValue('maxPrice', event.target.value)} placeholder="e.g. 80000" />
        </label>
        <label>
          <span>Minimum Beds</span>
          <input type="number" min="0" value={filters.minBeds} onChange={(event) => updateValue('minBeds', event.target.value)} placeholder="1" />
        </label>
        <label>
          <span>Maximum Beds</span>
          <input type="number" min="0" value={filters.maxBeds} onChange={(event) => updateValue('maxBeds', event.target.value)} placeholder="4" />
        </label>
        <label>
          <span>Minimum Baths</span>
          <input type="number" min="0" value={filters.minBaths} onChange={(event) => updateValue('minBaths', event.target.value)} placeholder="1" />
        </label>
        <label>
          <span>Maximum Baths</span>
          <input type="number" min="0" value={filters.maxBaths} onChange={(event) => updateValue('maxBaths', event.target.value)} placeholder="3" />
        </label>
        <label>
          <span>Minimum Area (sqft)</span>
          <input type="number" min="0" value={filters.minSquareFeet} onChange={(event) => updateValue('minSquareFeet', event.target.value)} placeholder="850" />
        </label>
        <label>
          <span>Maximum Area (sqft)</span>
          <input type="number" min="0" value={filters.maxSquareFeet} onChange={(event) => updateValue('maxSquareFeet', event.target.value)} placeholder="1800" />
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

      <div className="filter-chip-section">
        <div>
          <h3>Property Type</h3>
          <div className="quick-filters">
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
          <div className="quick-filters">
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
          <div className="quick-filters">
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
      </div>
    </section>
  )
}
