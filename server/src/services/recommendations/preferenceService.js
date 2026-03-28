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
  const numbers = values.filter((value) => typeof value === 'number' && !Number.isNaN(value))
  if (!numbers.length) {
    return { min: null, max: null, average: null }
  }

  const min = Math.min(...numbers)
  const max = Math.max(...numbers)
  const average = Math.round(numbers.reduce((sum, value) => sum + value, 0) / numbers.length)

  return { min, max, average }
}

function buildSummary(preference) {
  if (!preference?.onboardingCompleted) return ''

  const area = preference.onboardingAnswers?.preferredArea
  const type = preference.onboardingAnswers?.propertyType
  const avgBudget = preference.preferredPriceRange?.average || preference.onboardingAnswers?.budgetMax
  const listingType = preference.onboardingAnswers?.listingType

  return [
    area ? `Area: ${area}` : null,
    type ? `Type: ${type}` : null,
    avgBudget ? `Budget: ৳${Number(avgBudget).toLocaleString()}` : null,
    listingType ? `Mode: ${listingType}` : null
  ].filter(Boolean).join(' • ')
}

export function buildPreferencePayloadFromOnboarding(userId, answers = {}, existingPreference = null) {
  const preferredArea = String(answers.preferredArea || '').trim()
  const propertyType = String(answers.propertyType || '').trim()
  const listingType = String(answers.listingType || '').trim()
  const mustHaveAmenity = String(answers.mustHaveAmenity || '').trim()
  const budgetMin = answers.budgetMin === '' || answers.budgetMin === null || answers.budgetMin === undefined
    ? null
    : Number(answers.budgetMin)
  const budgetMax = answers.budgetMax === '' || answers.budgetMax === null || answers.budgetMax === undefined
    ? null
    : Number(answers.budgetMax)
  const bedrooms = answers.bedrooms === '' || answers.bedrooms === null || answers.bedrooms === undefined
    ? null
    : Number(answers.bedrooms)

  const payload = {
    user: userId,
    preferredAreas: preferredArea ? [{ value: preferredArea, score: 10 }] : existingPreference?.preferredAreas || [],
    dislikedAreas: existingPreference?.dislikedAreas || [],
    preferredPropertyTypes: propertyType ? [{ value: propertyType, score: 8 }] : existingPreference?.preferredPropertyTypes || [],
    preferredListingTypes: listingType ? [{ value: listingType, score: 6 }] : existingPreference?.preferredListingTypes || [],
    preferredAmenities: mustHaveAmenity ? [{ value: mustHaveAmenity, score: 5 }] : existingPreference?.preferredAmenities || [],
    preferredBedrooms: bedrooms !== null
      ? { min: Math.max(0, bedrooms - 1), max: bedrooms + 1, average: bedrooms }
      : existingPreference?.preferredBedrooms || { min: null, max: null, average: null },
    preferredBathrooms: existingPreference?.preferredBathrooms || { min: null, max: null, average: null },
    preferredPriceRange: budgetMin !== null || budgetMax !== null
      ? {
          min: budgetMin,
          max: budgetMax,
          average: budgetMin !== null && budgetMax !== null ? Math.round((budgetMin + budgetMax) / 2) : budgetMax || budgetMin || null
        }
      : existingPreference?.preferredPriceRange || { min: null, max: null, average: null },
    onboardingCompleted: true,
    onboardingSource: 'tenant-onboarding',
    onboardingAnswers: {
      preferredArea,
      budgetMin,
      budgetMax,
      propertyType,
      bedrooms,
      listingType,
      mustHaveAmenity
    },
    algorithmVersion: 'v2-hybrid-wow',
    lastInferredAt: new Date()
  }

  payload.lastSignalsSummary = buildSummary(payload)
  return payload
}

export async function saveOnboardingPreferences(userId, answers = {}) {
  const existingPreference = await UserPreference.findOne({ user: userId }).lean()
  const payload = buildPreferencePayloadFromOnboarding(userId, answers, existingPreference)

  return UserPreference.findOneAndUpdate(
    { user: userId },
    payload,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean()
}

export async function inferUserPreferences(userId) {
  const [favorites, interactions, existingPreference] = await Promise.all([
    Favorite.find({ tenant: userId }).populate('property').lean(),
    InteractionLog.find({ user: userId }).sort({ createdAt: -1 }).limit(200).lean(),
    UserPreference.findOne({ user: userId }).lean()
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

  if (existingPreference?.onboardingCompleted) {
    if (existingPreference.onboardingAnswers?.preferredArea) incrementWeighted(areaScores, existingPreference.onboardingAnswers.preferredArea, 8)
    if (existingPreference.onboardingAnswers?.propertyType) incrementWeighted(propertyTypeScores, existingPreference.onboardingAnswers.propertyType, 7)
    if (existingPreference.onboardingAnswers?.listingType) incrementWeighted(listingTypeScores, existingPreference.onboardingAnswers.listingType, 5)
    if (existingPreference.onboardingAnswers?.mustHaveAmenity) incrementWeighted(amenityScores, existingPreference.onboardingAnswers.mustHaveAmenity, 5)
    if (typeof existingPreference.onboardingAnswers?.budgetMin === 'number') prices.push(existingPreference.onboardingAnswers.budgetMin)
    if (typeof existingPreference.onboardingAnswers?.budgetMax === 'number') prices.push(existingPreference.onboardingAnswers.budgetMax)
    if (typeof existingPreference.onboardingAnswers?.bedrooms === 'number') bedrooms.push(existingPreference.onboardingAnswers.bedrooms)
  }

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
    onboardingCompleted: existingPreference?.onboardingCompleted || false,
    onboardingSource: existingPreference?.onboardingSource || '',
    onboardingAnswers: existingPreference?.onboardingAnswers || {},
    algorithmVersion: 'v2-hybrid-wow',
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
