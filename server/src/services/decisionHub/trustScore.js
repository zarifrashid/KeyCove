const TRUST_LABELS = {
  excellent: 'Excellent Listing',
  good: 'Good Listing',
  fair: 'Fair Listing',
  incomplete: 'Incomplete Listing'
}

function present(value) {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number') return Number.isFinite(value) && value > 0
  if (Array.isArray(value)) return value.length > 0
  return Boolean(value)
}

function imageCount(property = {}) {
  const urls = new Set()
  if (present(property.image)) urls.add(String(property.image).trim())
  if (Array.isArray(property.images)) {
    property.images.forEach((item) => {
      const url = typeof item === 'string' ? item : item?.url
      if (present(url)) urls.add(String(url).trim())
    })
  }
  return urls.size
}

function hasCoordinates(location = {}) {
  return Number.isFinite(Number(location.latitude)) && Number.isFinite(Number(location.longitude))
}

function hasRoomDimensions(property = {}) {
  return Array.isArray(property?.arAssets?.roomTemplates)
    && property.arAssets.roomTemplates.some((room) => present(room?.name) && Number(room?.width) > 0 && Number(room?.length) > 0)
}

function hasDesignRoomsLayout(property = {}, options = {}) {
  if (options.hasDefaultDesignRooms === true) return true
  const assets = property?.arAssets || {}
  if (Array.isArray(assets.roomTemplates) && assets.roomTemplates.length > 0) return true
  if (Array.isArray(assets.furnitureCatalog) && assets.furnitureCatalog.length > 0) return true
  return present(assets.floorPlanModelUrl) || present(assets.propertyModelUrl)
}

function managerVerified(property = {}) {
  const manager = property?.manager || {}
  return Boolean(manager.verified || manager.isVerified || manager.verificationStatus === 'verified')
}

function addBreakdown(breakdown, key, label, earned, max) {
  breakdown[key] = { label, earned, max }
}

function levelForScore(score) {
  if (score >= 85) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'fair'
  return 'incomplete'
}

export function calculateListingTrust(property = {}, options = {}) {
  const positives = []
  const missing = []
  const breakdown = {}
  let score = 0

  const totalImages = imageCount(property)
  const imagePoints = totalImages >= 3 ? 20 : totalImages > 0 ? 10 : 0
  score += imagePoints
  addBreakdown(breakdown, 'images', 'Images', imagePoints, 20)
  if (imagePoints === 20) positives.push(`${totalImages} property images`)
  else if (imagePoints === 10) positives.push(`${totalImages} property image${totalImages === 1 ? '' : 's'}`)
  else missing.push('Property images missing')

  const location = property.location || {}
  const fullLocation = present(location.address) && present(location.area) && present(location.city) && hasCoordinates(location)
  const partialLocation = present(location.address) || present(location.area) || present(location.city) || hasCoordinates(location)
  const locationPoints = fullLocation ? 15 : partialLocation ? 8 : 0
  score += locationPoints
  addBreakdown(breakdown, 'location', 'Location', locationPoints, 15)
  if (fullLocation) positives.push('Full address and map coordinates')
  else if (partialLocation) positives.push('Partial location available')
  else missing.push('Location details missing')

  const basicFields = [
    property.title,
    property.description,
    property.price,
    property.bedrooms || property.bedrooms === 0 ? property.bedrooms : null,
    property.bathrooms || property.bathrooms === 0 ? property.bathrooms : null,
    property.squareFeet
  ]
  const completeBasicCount = basicFields.filter(present).length
  const basicPoints = completeBasicCount === basicFields.length ? 15 : completeBasicCount >= 3 ? 8 : 0
  score += basicPoints
  addBreakdown(breakdown, 'basicInfo', 'Basic Info', basicPoints, 15)
  if (basicPoints === 15) positives.push('Core listing facts complete')
  else missing.push('Basic listing facts incomplete')

  const amenityCount = Array.isArray(property.amenities) ? property.amenities.filter(Boolean).length : 0
  const amenityPoints = amenityCount >= 4 ? 10 : amenityCount > 0 ? 5 : 0
  score += amenityPoints
  addBreakdown(breakdown, 'amenities', 'Amenities', amenityPoints, 10)
  if (amenityPoints === 10) positives.push(`${amenityCount} amenities listed`)
  else if (amenityPoints === 5) positives.push('Some amenities listed')
  else missing.push('Amenities missing')

  const roomPoints = hasRoomDimensions(property) ? 15 : 0
  score += roomPoints
  addBreakdown(breakdown, 'roomDimensions', 'Room Dimensions', roomPoints, 15)
  if (roomPoints) positives.push('Room dimensions provided')
  else missing.push('Room dimensions missing')

  const designRoomsPoints = hasDesignRoomsLayout(property, options) ? 15 : 0
  score += designRoomsPoints
  addBreakdown(breakdown, 'designRooms', 'Design Rooms', designRoomsPoints, 15)
  if (designRoomsPoints) positives.push('Design Rooms layout available')
  else missing.push('Design Rooms layout missing')

  const verificationPoints = managerVerified(property) ? 10 : 0
  score += verificationPoints
  addBreakdown(breakdown, 'managerVerification', 'Manager Verification', verificationPoints, 10)
  if (verificationPoints) positives.push('Verified manager')
  else missing.push('Manager verification unavailable')

  const finalScore = Math.max(0, Math.min(100, score))
  const level = levelForScore(finalScore)

  return {
    propertyId: property?._id?.toString?.() || property?.id || '',
    score: finalScore,
    level,
    label: TRUST_LABELS[level],
    positives,
    missing,
    breakdown,
    hasRoomDimensions: roomPoints > 0,
    hasDesignRoomsLayout: designRoomsPoints > 0,
    managerVerified: verificationPoints > 0
  }
}

export function getTrustLabel(level) {
  return TRUST_LABELS[level] || TRUST_LABELS.incomplete
}
