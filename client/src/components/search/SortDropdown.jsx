const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'beds_desc', label: 'Most Bedrooms' },
  { value: 'baths_desc', label: 'Most Bathrooms' },
  { value: 'sqft_desc', label: 'Largest Area' },
  { value: 'area_asc', label: 'Area Name (A-Z)' }
]

export default function SortDropdown({ value, onChange }) {
  return (
    <label className="sort-dropdown">
      <span>Sort By</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}
