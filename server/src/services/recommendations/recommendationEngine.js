import AffordabilityAnalysis from '../../models/AffordabilityAnalysis.js'
import Favorite from '../../models/Favorite.js'
import InteractionLog from '../../models/InteractionLog.js'
import Property from '../../models/Property.js'
import Recommendation from '../../models/Recommendation.js'
import UserPreference from '../../models/UserPreference.js'
import { inferUserPreferences } from './preferenceService.js'

const ALGORITHM_VERSION = 'v2-hybrid-wow'
const DEFAULT_LIMIT = 6

function topValues(items = []) {
  return items.map((item) => item.value)
}

function uniqueStrings(items = []) {
  return Array.from(new Set(items.filter(Boolean).map((item) => String(item))))
}

function normalizeText(value = '') {
  return String(value || '').trim().toLowerCase()
}

function matchesExactText(left, right) {
  return normalizeText(left) && normalizeText(left) === normalizeText(right)
}

function buildActiveFilters(preference = {}) {
  const answers = preference?.onboardingAnswers || {}
  const filters = {
    area: normalizeText(answers.preferredArea),
    listingType: normalizeText(answers.listingType),
    propertyType: normalizeText(answers.propertyType),
    amenity: normalizeText(answers.mustHaveAmenity),
    budgetMin: typeof answers.budgetMin === 'number' ? answers.budgetMin : null,
    budgetMax: typeof answers.budgetMax === 'number' ? answers.budgetMax : null,
    bedrooms: typeof answers.bedrooms === 'number' ? answers.bedrooms : null
  }

  const hasStrictQuiz = Boolean(filters.area || filters.listingType || filters.propertyType || filters.amenity || filters.budgetMin !== null || filters.budgetMax !== null || filters.bedrooms !== null)

  return {
    ...filters,
    hasStrictQuiz
  }
}

function passesStrictFilters(property, strictFilters) {
  if (!strictFilters?.hasStrictQuiz) return true
  if (strictFilters.area && !matchesExactText(property.location?.area, strictFilters.area)) return false
  if (strictFilters.listingType && !matchesExactText(property.listingType, strictFilters.listingType)) return false
  if (strictFilters.propertyType && !matchesExactText(property.propertyType, strictFilters.propertyType)) return false
  if (strictFilters.amenity && !(property.amenities || []).some((amenity) => matchesExactText(amenity, strictFilters.amenity))) return false
  if (strictFilters.budgetMin !== null && Number(property.price || 0) < strictFilters.budgetMin) return false
  if (strictFilters.budgetMax !== null && Number(property.price || 0) > strictFilters.budgetMax) return false
  if (strictFilters.bedrooms !== null && Number(property.bedrooms || 0) !== strictFilters.bedrooms) return false
  return true
}

function buildBadges({ details, property, safeMonthlyRent }) {
  const badges = []

  if (details.affordabilityFit) badges.push('Budget-safe')
  if (details.areaMatch && details.propertyTypeMatch) badges.push('Strong match')
  if (details.collaborativeBoost >= 6) badges.push('Popular with similar users')
  if (details.amenityOverlap >= 2) badges.push('Amenity fit')
  if (!badges.length && property.listingType === 'rent' && safeMonthlyRent && property.price <= safeMonthlyRent * 1.1) {
    badges.push('Good budget fit')
  }
  if (!badges.length) badges.push('Recommended')

  return badges.slice(0, 2)
}

function buildReason({ property, preference, scoreDetails, safeMonthlyRent = null, coldStart = false }) {
  const topArea = preference.onboardingAnswers?.preferredArea || preference.preferredAreas?.[0]?.value
  const topType = preference.onboardingAnswers?.propertyType || preference.preferredPropertyTypes?.[0]?.value
  const avgBudget = preference.onboardingAnswers?.budgetMax || preference.preferredPriceRange?.average
  const mustHaveAmenity = preference.onboardingAnswers?.mustHaveAmenity || preference.preferredAmenities?.[0]?.value

  if (scoreDetails.affordabilityFit && safeMonthlyRent) return `Fits within your budget-safe range of ৳${Number(safeMonthlyRent).toLocaleString()}`
  if (scoreDetails.areaMatch && scoreDetails.propertyTypeMatch && topArea && topType) {
    return `Matches your ${topArea} and ${topType.toLowerCase()} preference`
  }
  if (scoreDetails.areaMatch && topArea) return `Recommended for your preferred area: ${topArea}`
  if (scoreDetails.priceMatch && topType) return `Close to your budget for a ${topType.toLowerCase()}`
  if (scoreDetails.amenityOverlap && mustHaveAmenity) return `Includes ${mustHaveAmenity}, which you selected`
  if (scoreDetails.savedSimilarity) return 'Similar to places you saved before'
  if (scoreDetails.viewSimilarity) return 'Based on your recent browsing activity'
  if (coldStart && topType) return `Starter pick based on your ${topType.toLowerCase()} preference`
  if (avgBudget && property.price <= avgBudget * 1.1) return 'Close to your usual budget range'
  return 'Picked from your recent activity on KeyCove'
}

function buildWhyChips({ property, preference, scoreDetails, safeMonthlyRent = null }) {
  const chips = []
  const topArea = preference.onboardingAnswers?.preferredArea || preference.preferredAreas?.[0]?.value
  const topType = preference.onboardingAnswers?.propertyType || preference.preferredPropertyTypes?.[0]?.value

  if (scoreDetails.areaMatch && topArea) chips.push(`Area: ${topArea}`)
  if (scoreDetails.propertyTypeMatch && topType) chips.push(`Type: ${topType}`)
  if (scoreDetails.priceMatch) chips.push('Budget aligned')
  if (scoreDetails.affordabilityFit && safeMonthlyRent) chips.push(`Within ৳${Number(safeMonthlyRent).toLocaleString()}`)
  if (scoreDetails.amenityOverlap >= 1) chips.push(`Amenities +${scoreDetails.amenityOverlap}`)
  if (scoreDetails.collaborativeBoost >= 3) chips.push('Similar users liked this')
  if (!chips.length) chips.push(property.listingType === 'rent' ? 'Fresh rental pick' : 'Fresh property pick')

  return chips.slice(0, 3)
}

function buildPreferenceChips(preference = {}, affordabilityProfile = null) {
  const answers = preference?.onboardingAnswers || {}
  const chips = []

  if (answers.preferredArea) chips.push(`Area: ${answers.preferredArea}`)
  if (answers.propertyType) chips.push(`Type: ${answers.propertyType}`)
  if (answers.listingType) chips.push(`Mode: ${answers.listingType === 'sale' ? 'Buy' : 'Rent'}`)
  if (typeof answers.bedrooms === 'number') chips.push(`Beds: ${answers.bedrooms}`)
  if (typeof answers.budgetMax === 'number') chips.push(`Budget ≤ ৳${Number(answers.budgetMax).toLocaleString()}`)
  if (answers.mustHaveAmenity) chips.push(`Must-have: ${answers.mustHaveAmenity}`)
  if (affordabilityProfile?.safeMonthlyRent) chips.push(`Safe rent: ৳${Number(affordabilityProfile.safeMonthlyRent).toLocaleString()}`)

  return chips.slice(0, 6)
}

async function getExclusionSets(userId, excludePropertyIds = []) {
  const [favorites, dislikedInteractions, hiddenRecommendations] = await Promise.all([
    Favorite.find({ tenant: userId }).select('property').lean(),
    InteractionLog.find({ user: userId, interactionType: 'not_interested' }).select('property').lean(),
    Recommendation.find({ user: userId, feedbackType: 'not_interested' }).select('property').lean()
  ])

  return {
    favoriteIds: new Set(favorites.map((item) => String(item.property))),
    dislikedIds: new Set([...dislikedInteractions, ...hiddenRecommendations].map((item) => String(item.property))),
    explicitlyExcludedIds: new Set(uniqueStrings(excludePropertyIds))
  }
}

async function getCollaborativeBoost(userId, candidateIds) {
  const userFavorites = await Favorite.find({ tenant: userId }).select('property').lean()
  const favoritePropertyIds = userFavorites.map((item) => item.property)
  if (!favoritePropertyIds.length || !candidateIds.length) return new Map()

  const similarUserFavorites = await Favorite.aggregate([
    { $match: { property: { $in: favoritePropertyIds } } },
    { $group: { _id: '$tenant', overlap: { $sum: 1 } } },
    { $match: { _id: { $ne: userId }, overlap: { $gte: 1 } } } ,
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

function calculateScore(property, preference, collaborativeMap, exclusionSets, recentViewedIds, affordabilityProfile, strictFilters) {
  const propertyId = String(property._id)
  if (exclusionSets.favoriteIds.has(propertyId)) return null
  if (exclusionSets.dislikedIds.has(propertyId)) return null
  if (exclusionSets.explicitlyExcludedIds.has(propertyId)) return null
  if (property.status !== 'active') return null
  if (!passesStrictFilters(property, strictFilters)) return null

  let score = 0
  const details = {
    areaMatch: false,
    priceMatch: false,
    propertyTypeMatch: false,
    savedSimilarity: false,
    viewSimilarity: false,
    affordabilityFit: false,
    contentScore: 0,
    collaborativeBoost: 0,
    amenityOverlap: 0
  }

  const preferredAreas = topValues(preference.preferredAreas).map(normalizeText)
  const dislikedAreas = topValues(preference.dislikedAreas).map(normalizeText)
  const preferredTypes = topValues(preference.preferredPropertyTypes).map(normalizeText)
  const preferredListingTypes = topValues(preference.preferredListingTypes).map(normalizeText)
  const preferredAmenities = topValues(preference.preferredAmenities).map(normalizeText)

  if (preferredAreas.includes(normalizeText(property.location?.area))) {
    score += 24
    details.areaMatch = true
  }

  if (dislikedAreas.includes(normalizeText(property.location?.area))) {
    score -= 30
  }

  if (preferredTypes.includes(normalizeText(property.propertyType))) {
    score += 16
    details.propertyTypeMatch = true
  }

  if (preferredListingTypes.includes(normalizeText(property.listingType))) {
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
  } else if (strictFilters?.budgetMax !== null && typeof property.price === 'number' && property.price <= strictFilters.budgetMax) {
    score += 18
    details.priceMatch = true
  }

  const bedPref = preference.preferredBedrooms || {}
  if (bedPref.average !== null && Math.abs((property.bedrooms || 0) - bedPref.average) <= 1) {
    score += 8
  }

  const bathPref = preference.preferredBathrooms || {}
  if (bathPref.average !== null && Math.abs((property.bathrooms || 0) - bathPref.average) <= 1) {
    score += 6
  }

  const amenityOverlap = (property.amenities || []).filter((amenity) => preferredAmenities.includes(normalizeText(amenity))).length
  details.amenityOverlap = amenityOverlap
  if (amenityOverlap) {
    score += Math.min(amenityOverlap * 4, 16)
  }

  if (recentViewedIds.has(propertyId)) {
    score += 6
    details.viewSimilarity = true
  }

  if (affordabilityProfile?.safeMonthlyRent && property.listingType === 'rent') {
    if (property.price <= affordabilityProfile.safeMonthlyRent) {
      score += 14
      details.affordabilityFit = true
    } else if (property.price <= affordabilityProfile.safeMonthlyRent * 1.1) {
      score += 5
    } else if (property.price > affordabilityProfile.safeMonthlyRent * 1.3) {
      score -= 8
    }
  }

  const collaborativeBoost = collaborativeMap.get(propertyId) || 0
  if (collaborativeBoost) {
    const appliedBoost = Math.min(collaborativeBoost * 3, 15)
    score += appliedBoost
    details.collaborativeBoost = appliedBoost
    if (appliedBoost >= 6) details.savedSimilarity = true
  }

  if (strictFilters?.hasStrictQuiz) {
    score += 12
  }

  details.contentScore = score
  return { score, details }
}

function diversifyResults(items = [], limit) {
  const chosen = []
  const areaCount = new Map()
  const typeCount = new Map()

  const takeItem = (item, relaxed = false) => {
    const areaKey = normalizeText(item.property.location?.area) || 'unknown-area'
    const typeKey = normalizeText(item.property.propertyType) || 'unknown-type'
    const nextAreaCount = areaCount.get(areaKey) || 0
    const nextTypeCount = typeCount.get(typeKey) || 0

    if (!relaxed && (nextAreaCount >= 3 || nextTypeCount >= 4)) return false

    chosen.push(item)
    areaCount.set(areaKey, nextAreaCount + 1)
    typeCount.set(typeKey, nextTypeCount + 1)
    return true
  }

  for (const item of items) {
    if (chosen.length >= limit) break
    takeItem(item, false)
  }

  if (chosen.length < limit) {
    for (const item of items) {
      if (chosen.length >= limit) break
      if (chosen.some((picked) => String(picked.property._id) === String(item.property._id))) continue
      takeItem(item, true)
    }
  }

  return chosen.slice(0, limit)
}

async function buildColdStartRecommendations({ userId, limit, excludePropertyIds = [], preference, affordabilityProfile }) {
  const exclusionSets = await getExclusionSets(userId, excludePropertyIds)
  const strictFilters = buildActiveFilters(preference)
  const preferredAreaRaw = preference?.onboardingAnswers?.preferredArea
  const budgetMax = preference?.onboardingAnswers?.budgetMax
  const preferredAmenityRaw = preference?.onboardingAnswers?.mustHaveAmenity

  let properties = await Property.find({ status: 'active' })
    .sort({ createdAt: -1 })
    .limit(limit * 10)
    .lean()

  if (properties.length < limit) {
    const popularFavorites = await Favorite.aggregate([
      { $group: { _id: '$property', saveCount: { $sum: 1 } } },
      { $sort: { saveCount: -1 } },
      { $limit: 40 }
    ])

    const popularIds = popularFavorites.map((item) => item._id)
    if (popularIds.length) {
      const popularProperties = await Property.find({ _id: { $in: popularIds }, status: 'active' }).lean()
      const seen = new Set(properties.map((item) => String(item._id)))
      popularProperties.forEach((item) => {
        if (!seen.has(String(item._id))) properties.push(item)
      })
    }
  }

  const filtered = properties.filter((property) => {
    const propertyId = String(property._id)
    return (
      !exclusionSets.favoriteIds.has(propertyId) &&
      !exclusionSets.dislikedIds.has(propertyId) &&
      !exclusionSets.explicitlyExcludedIds.has(propertyId) &&
      passesStrictFilters(property, strictFilters)
    )
  })

  return filtered.slice(0, limit).map((property, index) => {
    const details = {
      areaMatch: preferredAreaRaw ? matchesExactText(property.location?.area, preferredAreaRaw) : false,
      priceMatch: budgetMax ? property.price <= budgetMax : false,
      propertyTypeMatch: strictFilters.propertyType ? matchesExactText(property.propertyType, strictFilters.propertyType) : false,
      affordabilityFit: Boolean(
        affordabilityProfile?.safeMonthlyRent &&
        property.listingType === 'rent' &&
        property.price <= affordabilityProfile.safeMonthlyRent
      ),
      collaborativeBoost: 0,
      contentScore: 0,
      amenityOverlap: preferredAmenityRaw && (property.amenities || []).some((item) => matchesExactText(item, preferredAmenityRaw)) ? 1 : 0,
      savedSimilarity: false,
      viewSimilarity: false
    }

    return {
      property,
      score: 100 - index,
      reason: buildReason({
        property,
        preference,
        scoreDetails: details,
        safeMonthlyRent: affordabilityProfile?.safeMonthlyRent || null,
        coldStart: true
      }),
      source: 'cold_start',
      details
    }
  })
}

export async function generateRecommendationsForUser(
  userId,
  { limit = DEFAULT_LIMIT, refresh = true, excludePropertyIds = [] } = {}
) {
  const [preference, affordabilityProfile, preferenceDoc] = await Promise.all([
    inferUserPreferences(userId),
    AffordabilityAnalysis.findOne({ user: userId }).sort({ createdAt: -1 }).lean(),
    UserPreference.findOne({ user: userId }).lean()
  ])

  const interactionCount = await InteractionLog.countDocuments({ user: userId })
  const favoriteCount = await Favorite.countDocuments({ tenant: userId })
  const needsOnboarding = interactionCount + favoriteCount < 3 && !preferenceDoc?.onboardingCompleted
  const strictFilters = buildActiveFilters(preference)

  let results = []

  if (interactionCount + favoriteCount < 3) {
    results = await buildColdStartRecommendations({
      userId,
      limit,
      excludePropertyIds,
      preference,
      affordabilityProfile
    })
  } else {
    const exclusionSets = await getExclusionSets(userId, excludePropertyIds)
    const candidateProperties = await Property.find({ status: 'active' }).sort({ createdAt: -1 }).limit(200).lean()
    const collaborativeMap = await getCollaborativeBoost(userId, candidateProperties.map((item) => item._id))
    const recentViews = await InteractionLog.find({ user: userId, interactionType: 'property_view' })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('property')
      .lean()
    const recentViewedIds = new Set(recentViews.map((item) => String(item.property)))

    const scoredResults = candidateProperties
      .map((property) => {
        const scored = calculateScore(property, preference, collaborativeMap, exclusionSets, recentViewedIds, affordabilityProfile, strictFilters)
        if (!scored || scored.score <= 0) return null

        return {
          property,
          score: scored.score,
          reason: buildReason({
            property,
            preference,
            scoreDetails: scored.details,
            safeMonthlyRent: affordabilityProfile?.safeMonthlyRent || null
          }),
          source: 'hybrid',
          details: scored.details
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)

    results = diversifyResults(scoredResults, limit)
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
          affordabilityFit: !!item.details.affordabilityFit,
          collaborativeBoost: item.details.collaborativeBoost || 0,
          contentScore: item.details.contentScore || 0,
          badges: buildBadges({ details: item.details, property: item.property, safeMonthlyRent: affordabilityProfile?.safeMonthlyRent || null })
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean()))
  }

  const recommendationIdByProperty = new Map(persistedRecommendations.map((item) => [String(item.property), String(item._id)]))

  return {
    algorithmVersion: ALGORITHM_VERSION,
    preferenceSummary: preference?.lastSignalsSummary || '',
    preferenceChips: buildPreferenceChips(preference, affordabilityProfile),
    affordabilitySummary: affordabilityProfile?.safeMonthlyRent
      ? `Budget-safe rent up to ৳${Number(affordabilityProfile.safeMonthlyRent).toLocaleString()}`
      : '',
    needsOnboarding,
    coldStart: interactionCount + favoriteCount < 3,
    recommendations: results.map((item) => ({
      recommendationId: recommendationIdByProperty.get(String(item.property._id)) || null,
      property: item.property,
      score: item.score,
      reason: item.reason,
      badges: buildBadges({ details: item.details, property: item.property, safeMonthlyRent: affordabilityProfile?.safeMonthlyRent || null }),
      whyThisProperty: buildWhyChips({
        property: item.property,
        preference,
        scoreDetails: item.details,
        safeMonthlyRent: affordabilityProfile?.safeMonthlyRent || null
      }),
      matchLabel: item.score >= 60 ? 'Top match' : item.score >= 40 ? 'Strong match' : 'Recommended',
      source: item.source
    }))
  }
}
