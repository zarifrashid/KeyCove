function toNumber(value) {
  if (value === undefined || value === null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function toArray(value) {
  if (!value) return []
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function escapeRegex(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function buildBoundsFilter({ northEastLat, northEastLng, southWestLat, southWestLng }) {
  const hasBounds = [northEastLat, northEastLng, southWestLat, southWestLng].every((value) => value !== undefined)

  if (!hasBounds) return null

  const neLat = toNumber(northEastLat)
  const neLng = toNumber(northEastLng)
  const swLat = toNumber(southWestLat)
  const swLng = toNumber(southWestLng)

  if (![neLat, neLng, swLat, swLng].every((value) => value !== null)) return null

  return {
    'location.latitude': { $gte: swLat, $lte: neLat },
    'location.longitude': { $gte: swLng, $lte: neLng }
  }
}

export function buildPropertyFilter(query = {}) {
  const filter = { status: 'active' }
  const andConditions = []

  const search = (query.search || '').trim()
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i')
    andConditions.push({
      $or: [
        { title: regex },
        { description: regex },
        { 'location.area': regex },
        { 'location.address': regex },
        { 'location.city': regex },
        { propertyType: regex },
        { amenities: regex }
      ]
    })
  }

  const area = (query.area || '').trim()
  if (area && area.toLowerCase() !== 'all') {
    andConditions.push({
      'location.area': new RegExp(`^${escapeRegex(area)}$`, 'i')
    })
  }

  const minPrice = toNumber(query.minPrice)
  const maxPrice = toNumber(query.maxPrice)
  if (minPrice !== null || maxPrice !== null) {
    const priceFilter = {}
    if (minPrice !== null) priceFilter.$gte = minPrice
    if (maxPrice !== null) priceFilter.$lte = maxPrice
    andConditions.push({ price: priceFilter })
  }

  const minBeds = toNumber(query.minBeds)
  const maxBeds = toNumber(query.maxBeds)
  if (minBeds !== null || maxBeds !== null) {
    const bedFilter = {}
    if (minBeds !== null) bedFilter.$gte = minBeds
    if (maxBeds !== null) bedFilter.$lte = maxBeds
    andConditions.push({ bedrooms: bedFilter })
  }

  const minBaths = toNumber(query.minBaths)
  const maxBaths = toNumber(query.maxBaths)
  if (minBaths !== null || maxBaths !== null) {
    const bathFilter = {}
    if (minBaths !== null) bathFilter.$gte = minBaths
    if (maxBaths !== null) bathFilter.$lte = maxBaths
    andConditions.push({ bathrooms: bathFilter })
  }

  const minSquareFeet = toNumber(query.minSquareFeet)
  const maxSquareFeet = toNumber(query.maxSquareFeet)
  if (minSquareFeet !== null || maxSquareFeet !== null) {
    const areaFilter = {}
    if (minSquareFeet !== null) areaFilter.$gte = minSquareFeet
    if (maxSquareFeet !== null) areaFilter.$lte = maxSquareFeet
    andConditions.push({ squareFeet: areaFilter })
  }

  const propertyTypes = toArray(query.propertyType)
  if (propertyTypes.length) {
    andConditions.push({ propertyType: { $in: propertyTypes } })
  }

  const listingTypes = toArray(query.listingType)
  if (listingTypes.length) {
    andConditions.push({ listingType: { $in: listingTypes } })
  }

  const amenities = toArray(query.amenities)
  if (amenities.length) {
    andConditions.push({ amenities: { $all: amenities } })
  }

  const availableFrom = query.availableFrom ? new Date(query.availableFrom) : null
  if (availableFrom && !Number.isNaN(availableFrom.getTime())) {
    andConditions.push({ availableFrom: { $lte: availableFrom } })
  }

  const postedAfter = query.postedAfter ? new Date(query.postedAfter) : null
  if (postedAfter && !Number.isNaN(postedAfter.getTime())) {
    andConditions.push({ createdAt: { $gte: postedAfter } })
  }

  const boundsFilter = buildBoundsFilter(query)
  if (boundsFilter) {
    andConditions.push(boundsFilter)
  }

  if (andConditions.length) {
    filter.$and = andConditions
  }

  return filter
}

export function extractSearchSnapshot(query = {}) {
  return {
    searchText: (query.search || '').trim(),
    area: (query.area || '').trim(),
    center: {
      latitude: toNumber(query.lat),
      longitude: toNumber(query.lng)
    },
    bounds: {
      northEastLat: toNumber(query.northEastLat),
      northEastLng: toNumber(query.northEastLng),
      southWestLat: toNumber(query.southWestLat),
      southWestLng: toNumber(query.southWestLng)
    },
    filters: {
      minPrice: toNumber(query.minPrice),
      maxPrice: toNumber(query.maxPrice),
      minBeds: toNumber(query.minBeds),
      maxBeds: toNumber(query.maxBeds),
      minBaths: toNumber(query.minBaths),
      maxBaths: toNumber(query.maxBaths),
      minSquareFeet: toNumber(query.minSquareFeet),
      maxSquareFeet: toNumber(query.maxSquareFeet),
      propertyType: toArray(query.propertyType),
      listingType: toArray(query.listingType),
      amenities: toArray(query.amenities),
      availableFrom: query.availableFrom || null,
      postedAfter: query.postedAfter || null
    }
  }
}
