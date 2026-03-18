export function buildSortOption(sortOption = 'newest') {
  switch (sortOption) {
    case 'price_asc':
      return { price: 1, createdAt: -1 }
    case 'price_desc':
      return { price: -1, createdAt: -1 }
    case 'beds_desc':
      return { bedrooms: -1, price: 1 }
    case 'baths_desc':
      return { bathrooms: -1, price: 1 }
    case 'sqft_desc':
      return { squareFeet: -1, price: 1 }
    case 'area_asc':
      return { 'location.area': 1, price: 1 }
    case 'newest':
    default:
      return { createdAt: -1, price: 1 }
  }
}
