const SORT_MAP = {
  newest: { createdAt: -1, price: 1 },
  price_asc: { price: 1, createdAt: -1 },
  price_desc: { price: -1, createdAt: -1 }
}

export const VALID_SORT_OPTIONS = Object.keys(SORT_MAP)

export function normalizeSortOption(sortOption = 'newest') {
  return VALID_SORT_OPTIONS.includes(sortOption) ? sortOption : 'newest'
}

export function buildSortOption(sortOption = 'newest') {
  return SORT_MAP[normalizeSortOption(sortOption)]
}
