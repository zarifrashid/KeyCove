export const VISIT_STATUS_OPTIONS = [
  { value: 'not_visited', label: 'Not Visited' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'visited', label: 'Visited' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'final_choice', label: 'Final Choice' }
]

export const DECISION_TAG_OPTIONS = [
  { value: 'best_location', label: 'Best Location' },
  { value: 'best_value', label: 'Best Value' },
  { value: 'most_spacious', label: 'Most Spacious' },
  { value: 'best_furnished', label: 'Best Furnished' },
  { value: 'best_for_family', label: 'Best for Family' },
  { value: 'closest_to_work', label: 'Closest to Work' },
  { value: 'final_choice', label: 'Final Choice' },
  { value: 'rejected', label: 'Rejected' }
]

export const DEFAULT_CHECKLIST = [
  'Room size matches listing',
  'Photos match actual property',
  'Good sunlight',
  'Good ventilation',
  'Low noise level',
  'Water supply checked',
  'Gas/electricity checked',
  'Internet/mobile network checked',
  'Security checked',
  'Building condition checked',
  'Lift/stairs checked',
  'Parking checked',
  'Balcony usable',
  'Kitchen condition checked',
  'Bathroom condition checked',
  'Neighbourhood feels safe'
]

export const TRUST_LABELS = {
  excellent: 'Excellent Listing',
  good: 'Good Listing',
  fair: 'Fair Listing',
  incomplete: 'Incomplete Listing'
}

export function getVisitStatusLabel(value) {
  return VISIT_STATUS_OPTIONS.find((item) => item.value === value)?.label || 'Not Visited'
}

export function getDecisionTagLabel(value) {
  return DECISION_TAG_OPTIONS.find((item) => item.value === value)?.label || value
}

export function buildDefaultChecklist(existing = []) {
  const byLabel = new Map((Array.isArray(existing) ? existing : []).map((item) => [item.label, item]))
  const defaults = DEFAULT_CHECKLIST.map((label) => ({
    label,
    checked: Boolean(byLabel.get(label)?.checked),
    note: byLabel.get(label)?.note || ''
  }))
  const custom = (Array.isArray(existing) ? existing : [])
    .filter((item) => item?.label && !DEFAULT_CHECKLIST.includes(item.label))
    .map((item) => ({ label: item.label, checked: Boolean(item.checked), note: item.note || '' }))
  return [...defaults, ...custom]
}

export function makeEmptyDecisionNote(propertyId = '') {
  return {
    propertyId,
    visitStatus: 'not_visited',
    personalRating: '',
    pros: '',
    cons: '',
    questionsForManager: '',
    privateNotes: '',
    checklist: buildDefaultChecklist(),
    decisionTags: [],
    compareSelected: false
  }
}

export function getPropertyImage(property) {
  return property?.image || property?.images?.find((item) => item?.url)?.url || '/keycove-logo.png'
}

export function formatCurrency(value, listingType) {
  const amount = `৳ ${Number(value || 0).toLocaleString()}`
  return listingType === 'rent' ? `${amount} / month` : amount
}

export function formatDate(value) {
  if (!value) return 'Not listed'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Not listed'
  return parsed.toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function hasRoomDimensions(property) {
  return Boolean(property?.arAssets?.roomTemplates?.some((room) => Number(room?.width) > 0 && Number(room?.length) > 0))
}

export function hasDesignRoomsLayout(property) {
  const assets = property?.arAssets || {}
  return Boolean(
    assets.roomTemplates?.length ||
    assets.furnitureCatalog?.length ||
    assets.propertyModelUrl ||
    assets.floorPlanModelUrl ||
    property?.designRoomsAvailable
  )
}

function countImages(property) {
  const urls = new Set()
  if (property?.image) urls.add(property.image)
  if (Array.isArray(property?.images)) {
    property.images.forEach((item) => {
      if (item?.url) urls.add(item.url)
    })
  }
  return urls.size
}

function hasFullLocation(property) {
  const loc = property?.location || {}
  return Boolean(loc.address && loc.area && loc.city && loc.latitude !== null && loc.latitude !== undefined && loc.longitude !== null && loc.longitude !== undefined)
}

function hasPartialLocation(property) {
  const loc = property?.location || {}
  return Boolean(loc.address || loc.area || loc.city)
}

function hasBasicInfo(property) {
  return Boolean(property?.title && property?.description && Number(property?.price) > 0 && Number(property?.bedrooms) >= 0 && Number(property?.bathrooms) >= 0 && Number(property?.squareFeet) > 0)
}

function hasPartialBasicInfo(property) {
  return Boolean(property?.title || property?.description || Number(property?.price) > 0 || Number(property?.squareFeet) > 0)
}

function managerVerified(manager) {
  if (!manager) return false
  return Boolean(manager.verified || manager.isVerified || manager.verificationStatus === 'verified')
}

function levelFromScore(score) {
  if (score >= 85) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'fair'
  return 'incomplete'
}

export function calculateLocalTrustBadge(property = {}) {
  const imageCount = countImages(property)
  const scoreParts = {
    images: imageCount >= 3 ? 20 : imageCount > 0 ? 10 : 0,
    location: hasFullLocation(property) ? 15 : hasPartialLocation(property) ? 8 : 0,
    basicInfo: hasBasicInfo(property) ? 15 : hasPartialBasicInfo(property) ? 8 : 0,
    amenities: property?.amenities?.length >= 4 ? 10 : property?.amenities?.length > 0 ? 5 : 0,
    roomDimensions: hasRoomDimensions(property) ? 15 : 0,
    designRooms: hasDesignRoomsLayout(property) ? 15 : 0,
    managerVerification: managerVerified(property?.manager) ? 10 : 0
  }
  const score = Object.values(scoreParts).reduce((sum, part) => sum + part, 0)
  const level = levelFromScore(score)
  const positives = []
  const missing = []

  if (scoreParts.images === 20) positives.push(`${imageCount} property images`)
  else missing.push('Add at least 3 property images')

  if (scoreParts.location === 15) positives.push('Complete location')
  else missing.push('Complete address and coordinates')

  if (scoreParts.basicInfo === 15) positives.push('Core property details complete')
  else missing.push('Complete title, description, price, beds, baths, and size')

  if (scoreParts.amenities === 10) positives.push('Amenities provided')
  else missing.push('Amenities incomplete')

  if (scoreParts.roomDimensions === 15) positives.push('Room dimensions provided')
  else missing.push('Room dimensions missing')

  if (scoreParts.designRooms === 15) positives.push('Design Rooms available')
  else missing.push('Design Rooms layout not added')

  if (scoreParts.managerVerification === 10) positives.push('Verified manager')
  else missing.push('Manager verification not confirmed')

  return {
    propertyId: property?._id,
    score,
    level,
    label: TRUST_LABELS[level],
    positives,
    missing,
    breakdown: {
      images: { label: 'Images', score: scoreParts.images, max: 20 },
      location: { label: 'Location', score: scoreParts.location, max: 15 },
      basicInfo: { label: 'Basic Info', score: scoreParts.basicInfo, max: 15 },
      amenities: { label: 'Amenities', score: scoreParts.amenities, max: 10 },
      roomDimensions: { label: 'Room Dimensions', score: scoreParts.roomDimensions, max: 15 },
      designRooms: { label: 'Design Rooms', score: scoreParts.designRooms, max: 15 },
      managerVerification: { label: 'Manager Verification', score: scoreParts.managerVerification, max: 10 }
    },
    hasRoomDimensions: scoreParts.roomDimensions === 15,
    hasDesignRoomsLayout: scoreParts.designRooms === 15,
    managerVerified: scoreParts.managerVerification === 10
  }
}

export function normalizeDecisionItem(item = {}) {
  const property = item.property || item.propertyId || {}
  return {
    ...item,
    property,
    note: {
      ...makeEmptyDecisionNote(property?._id),
      ...(item.note || {}),
      checklist: buildDefaultChecklist(item.note?.checklist),
      decisionTags: Array.isArray(item.note?.decisionTags) ? item.note.decisionTags : []
    },
    trustBadge: item.trustBadge || calculateLocalTrustBadge(property),
    applicationStatus: item.applicationStatus || { status: 'not_applied' }
  }
}
