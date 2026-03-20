import Favorite from '../../models/Favorite.js'
import InteractionLog from '../../models/InteractionLog.js'
import Property from '../../models/Property.js'
import Recommendation from '../../models/Recommendation.js'
import { inferUserPreferences } from './preferenceService.js'

const ALGORITHM_VERSION = 'v1-hybrid'
const DEFAULT_LIMIT = 6

function topValues(items = []) {
  return items.map((item) => item.value)
}

function buildReason({ property, preference, scoreDetails, coldStartReason = '' }) {
  if (coldStartReason) return coldStartReason

  const topArea = preference.preferredAreas?.[0]?.value
  const topType = preference.preferredPropertyTypes?.[0]?.value
  const avgBudget = preference.preferredPriceRange?.average

  if (scoreDetails.savedSimilarity) return 'Similar to properties you saved'
  if (scoreDetails.areaMatch && topArea) return `Recommended because you searched in ${topArea}`
  if (scoreDetails.priceMatch && scoreDetails.propertyTypeMatch) return 'Matches your preferred budget and apartment type'
  if (scoreDetails.viewSimilarity) return 'Based on your recent browsing activity'
  if (avgBudget && property.price <= avgBudget * 1.1) return 'Fits close to your usual budget range'
  if (topType) return `You often explore ${topType.toLowerCase()} listings`
  return 'Selected from your recent KeyCove activity'
}

async function getExclusionSets(userId) {
  const [favorites, dislikedInteractions, shownRecommendations] = await Promise.all([
    Favorite.find({ tenant: userId }).select('property').lean(),
    InteractionLog.find({ user: userId, interactionType: 'not_interested' }).select('property').lean(),
    Recommendation.find({ user: userId, feedbackType: 'not_interested' }).select('property').lean()
  ])

  return {
    favoriteIds: new Set(favorites.map((item) => String(item.property))),
    dislikedIds: new Set([...dislikedInteractions, ...shownRecommendations].map((item) => String(item.property)))
  }
}

async function getCollaborativeBoost(userId, candidateIds) {
  const userFavorites = await Favorite.find({ tenant: userId }).select('property').lean()
  const favoritePropertyIds = userFavorites.map((item) => item.property)
  if (!favoritePropertyIds.length || !candidateIds.length) return new Map()

  const similarUserFavorites = await Favorite.aggregate([
    { $match: { property: { $in: favoritePropertyIds } } },
    { $group: { _id: '$tenant', overlap: { $sum: 1 } } },
    { $match: { _id: { $ne: userId }, overlap: { $gte: 1 } } },
    { $sort: { overlap: -1 } },
    { $limit: 20 }
  ])

  const similarUserIds = similarUserFavorites.map((item) => item._id)
  if (!similarUserIds.length) return new Map()

  const candidateFavorites = await Favorite.aggregate([
    { $match: { tenant: { $in: similarUserIds }, property: { $in: candidateIds } } },
    { $group: { _id: '$property', score: { $sum: 1 } } }
  ])

  return new Map(candidateFavorites.map((item) => [String(item._id), item.score]))
}

function calculateScore(property, preference, collaborativeMap, exclusionSets, recentViewedIds) {
  const propertyId = String(property._id)
  if (exclusionSets.favoriteIds.has(propertyId)) return null
  if (exclusionSets.dislikedIds.has(propertyId)) return null
  if (property.status !== 'active') return null

  let score = 0
  const details = {
    areaMatch: false,
    priceMatch: false,
    propertyTypeMatch: false,
    savedSimilarity: false,
    viewSimilarity: false,
    contentScore: 0,
    collaborativeBoost: 0
  }

  const preferredAreas = topValues(preference.preferredAreas)
  const dislikedAreas = topValues(preference.dislikedAreas)
  const preferredTypes = topValues(preference.preferredPropertyTypes)
  const preferredListingTypes = topValues(preference.preferredListingTypes)
  const preferredAmenities = topValues(preference.preferredAmenities)

  if (preferredAreas.includes(property.location?.area)) {
    score += 24
    details.areaMatch = true
  }

  if (dislikedAreas.includes(property.location?.area)) {
    score -= 30
  }

  if (preferredTypes.includes(property.propertyType)) {
    score += 16
    details.propertyTypeMatch = true
  }

  if (preferredListingTypes.includes(property.listingType)) {
    score += 8
  }

  const range = preference.preferredPriceRange || {}
  if (typeof property.price === 'number' && range.min !== null && range.max !== null) {
    const paddedMin = range.min * 0.8
    const paddedMax = range.max * 1.2
    if (property.price >= paddedMin && property.price <= paddedMax) {
      score += 18
      details.priceMatch = true
    }
  }

  const bedPref = preference.preferredBedrooms || {}
  if (bedPref.average !== null && Math.abs((property.bedrooms || 0) - bedPref.average) <= 1) {
    score += 8
  }

  const bathPref = preference.preferredBathrooms || {}
  if (bathPref.average !== null && Math.abs((property.bathrooms || 0) - bathPref.average) <= 1) {
    score += 6
  }

  const amenityOverlap = (property.amenities || []).filter((amenity) => preferredAmenities.includes(amenity)).length
  if (amenityOverlap) {
    score += Math.min(amenityOverlap * 4, 16)
  }

  if (recentViewedIds.has(propertyId)) {
    score += 6
    details.viewSimilarity = true
  }

  const collaborativeBoost = collaborativeMap.get(propertyId) || 0
  if (collaborativeBoost) {
    const appliedBoost = Math.min(collaborativeBoost * 3, 15)
    score += appliedBoost
    details.collaborativeBoost = appliedBoost
  }

  details.contentScore = score
  return { score, details }
}

async function buildColdStartRecommendations({ userId, limit }) {
  const popularFavorites = await Favorite.aggregate([
    { $group: { _id: '$property', saveCount: { $sum: 1 } } },
    { $sort: { saveCount: -1 } },
    { $limit: 30 }
  ])

  const popularIds = popularFavorites.map((item) => item._id)
  let properties = []

  if (popularIds.length) {
    properties = await Property.find({ _id: { $in: popularIds }, status: 'active' }).lean()
  }

  if (properties.length < limit) {
    const newest = await Property.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
    const seen = new Set(properties.map((item) => String(item._id)))
    newest.forEach((item) => {
      if (!seen.has(String(item._id))) properties.push(item)
    })
  }

  return properties.slice(0, limit).map((property, index) => ({
    property,
    score: 100 - index,
    reason: index === 0 ? 'Popular with tenants on KeyCove right now' : 'Fresh active listing for new users',
    source: 'cold_start',
    details: {
      areaMatch: false,
      priceMatch: false,
      propertyTypeMatch: false,
      collaborativeBoost: 0,
      contentScore: 0
    }
  }))
}

export async function generateRecommendationsForUser(userId, { limit = DEFAULT_LIMIT, refresh = true } = {}) {
  const exclusionSets = await getExclusionSets(userId)
  const preference = await inferUserPreferences(userId)

  const interactionCount = await InteractionLog.countDocuments({ user: userId })
  const favoriteCount = await Favorite.countDocuments({ tenant: userId })

  let results = []

  if (interactionCount + favoriteCount < 3) {
    results = await buildColdStartRecommendations({ userId, limit })
  } else {
    const candidateProperties = await Property.find({ status: 'active' }).limit(120).lean()
    const collaborativeMap = await getCollaborativeBoost(userId, candidateProperties.map((item) => item._id))
    const recentViews = await InteractionLog.find({ user: userId, interactionType: 'property_view' })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('property')
      .lean()
    const recentViewedIds = new Set(recentViews.map((item) => String(item.property)))

    results = candidateProperties
      .map((property) => {
        const scored = calculateScore(property, preference, collaborativeMap, exclusionSets, recentViewedIds)
        if (!scored || scored.score <= 0) return null

        return {
          property,
          score: scored.score,
          reason: buildReason({ property, preference, scoreDetails: scored.details }),
          source: 'hybrid',
          details: scored.details
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  let persistedRecommendations = []

  if (refresh && results.length) {
    persistedRecommendations = await Promise.all(results.map((item) => Recommendation.findOneAndUpdate(
      { user: userId, property: item.property._id },
      {
        user: userId,
        property: item.property._id,
        score: item.score,
        reason: item.reason,
        algorithmVersion: ALGORITHM_VERSION,
        statusShown: true,
        source: item.source,
        metadata: {
          areaMatch: !!item.details.areaMatch,
          priceMatch: !!item.details.priceMatch,
          propertyTypeMatch: !!item.details.propertyTypeMatch,
          collaborativeBoost: item.details.collaborativeBoost || 0,
          contentScore: item.details.contentScore || 0
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean()))
  }

  const recommendationIdByProperty = new Map(persistedRecommendations.map((item) => [String(item.property), String(item._id)]))

  return {
    algorithmVersion: ALGORITHM_VERSION,
    preferenceSummary: preference?.lastSignalsSummary || '',
    recommendations: results.map((item) => ({
      recommendationId: recommendationIdByProperty.get(String(item.property._id)) || null,
      property: item.property,
      score: item.score,
      reason: item.reason,
      algorithmVersion: ALGORITHM_VERSION,
      source: item.source,
      metadata: item.details
    }))
  }
}
