import Favorite from '../../models/Favorite.js'
import InteractionLog from '../../models/InteractionLog.js'
import Property from '../../models/Property.js'
import UserPreference from '../../models/UserPreference.js'

function incrementWeighted(map, value, points) {
  const key = String(value || '').trim()
  if (!key) return
  map.set(key, (map.get(key) || 0) + points)
}

function mapToSortedArray(map, limit = 5) {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value, score]) => ({ value, score }))
}

function calculateRange(values = []) {
  if (!values.length) {
    return { min: null, max: null, average: null }
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const average = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)

  return { min, max, average }
}

function buildSummary(preference) {
  const area = preference.preferredAreas?.[0]?.value
  const type = preference.preferredPropertyTypes?.[0]?.value
  const avgBudget = preference.preferredPriceRange?.average

  return [
    area ? `Top area: ${area}` : null,
    type ? `Top type: ${type}` : null,
    avgBudget ? `Typical budget: ৳${avgBudget.toLocaleString()}` : null
  ].filter(Boolean).join(' • ')
}

export async function inferUserPreferences(userId) {
  const [favorites, interactions] = await Promise.all([
    Favorite.find({ tenant: userId }).populate('property').lean(),
    InteractionLog.find({ user: userId }).sort({ createdAt: -1 }).limit(200).lean()
  ])

  const propertyIdsFromInteractions = interactions
    .map((item) => item.property)
    .filter(Boolean)

  const interactionProperties = propertyIdsFromInteractions.length
    ? await Property.find({ _id: { $in: propertyIdsFromInteractions } }).lean()
    : []

  const propertyById = new Map(interactionProperties.map((item) => [item._id.toString(), item]))

  const areaScores = new Map()
  const dislikedAreaScores = new Map()
  const propertyTypeScores = new Map()
  const listingTypeScores = new Map()
  const amenityScores = new Map()
  const prices = []
  const bedrooms = []
  const bathrooms = []

  const consumeProperty = (property, weight = 1, negative = false) => {
    if (!property) return
    const area = property.location?.area
    if (negative) incrementWeighted(dislikedAreaScores, area, weight)
    else incrementWeighted(areaScores, area, weight)

    incrementWeighted(propertyTypeScores, property.propertyType, weight)
    incrementWeighted(listingTypeScores, property.listingType, weight)
    ;(property.amenities || []).forEach((amenity) => incrementWeighted(amenityScores, amenity, weight))

    if (!negative) {
      if (typeof property.price === 'number') prices.push(property.price)
      if (typeof property.bedrooms === 'number') bedrooms.push(property.bedrooms)
      if (typeof property.bathrooms === 'number') bathrooms.push(property.bathrooms)
    }
  }

  favorites.forEach((favorite) => consumeProperty(favorite.property, 5, false))

  interactions.forEach((interaction) => {
    if (interaction.interactionType === 'search') {
      incrementWeighted(areaScores, interaction.searchSnapshot?.area, 3)
      ;(interaction.searchSnapshot?.filters?.propertyType || []).forEach((value) => incrementWeighted(propertyTypeScores, value, 2))
      ;(interaction.searchSnapshot?.filters?.listingType || []).forEach((value) => incrementWeighted(listingTypeScores, value, 2))
      ;(interaction.searchSnapshot?.filters?.amenities || []).forEach((value) => incrementWeighted(amenityScores, value, 2))
      if (interaction.searchSnapshot?.filters?.minPrice) prices.push(interaction.searchSnapshot.filters.minPrice)
      if (interaction.searchSnapshot?.filters?.maxPrice) prices.push(interaction.searchSnapshot.filters.maxPrice)
      if (interaction.searchSnapshot?.filters?.minBeds !== null && interaction.searchSnapshot?.filters?.minBeds !== undefined) bedrooms.push(interaction.searchSnapshot.filters.minBeds)
      if (interaction.searchSnapshot?.filters?.maxBeds !== null && interaction.searchSnapshot?.filters?.maxBeds !== undefined) bedrooms.push(interaction.searchSnapshot.filters.maxBeds)
      if (interaction.searchSnapshot?.filters?.minBaths !== null && interaction.searchSnapshot?.filters?.minBaths !== undefined) bathrooms.push(interaction.searchSnapshot.filters.minBaths)
      if (interaction.searchSnapshot?.filters?.maxBaths !== null && interaction.searchSnapshot?.filters?.maxBaths !== undefined) bathrooms.push(interaction.searchSnapshot.filters.maxBaths)
      return
    }

    const property = propertyById.get(String(interaction.property || ''))
    if (!property) return

    if (interaction.interactionType === 'save') consumeProperty(property, 5, false)
    if (interaction.interactionType === 'recommendation_click') consumeProperty(property, 3, false)
    if (interaction.interactionType === 'property_view') consumeProperty(property, 2, false)
    if (interaction.interactionType === 'not_interested') consumeProperty(property, 6, true)
  })

  const preferencePayload = {
    user: userId,
    preferredAreas: mapToSortedArray(areaScores),
    dislikedAreas: mapToSortedArray(dislikedAreaScores),
    preferredPropertyTypes: mapToSortedArray(propertyTypeScores, 4),
    preferredListingTypes: mapToSortedArray(listingTypeScores, 3),
    preferredAmenities: mapToSortedArray(amenityScores, 8),
    preferredBedrooms: calculateRange(bedrooms),
    preferredBathrooms: calculateRange(bathrooms),
    preferredPriceRange: calculateRange(prices),
    algorithmVersion: 'v1-hybrid',
    lastInferredAt: new Date()
  }

  preferencePayload.lastSignalsSummary = buildSummary(preferencePayload)

  const preference = await UserPreference.findOneAndUpdate(
    { user: userId },
    preferencePayload,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean()

  return preference
}
