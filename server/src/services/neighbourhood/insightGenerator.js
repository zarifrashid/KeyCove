import NeighbourhoodInsight from '../../models/NeighbourhoodInsight.js'
import { getAreaProfile } from './dhakaAreaProfiles.js'
import { resolveDhakaArea } from './areaResolver.js'
import { generateNearbyPlacesForProperty } from './placesProvider.js'
import { calculateInsightScores } from './scoreCalculator.js'

function countByCategory(nearbyPlaces) {
  return nearbyPlaces.reduce((accumulator, place) => {
    accumulator[place.category] = (accumulator[place.category] || 0) + 1
    return accumulator
  }, {})
}

function buildHighlights(nearbyPlaces) {
  const counts = countByCategory(nearbyPlaces)
  const highlights = []

  if (counts.school || counts.college) {
    highlights.push(`${(counts.school || 0) + (counts.college || 0)} education spots nearby`)
  }

  if (counts.hospital) {
    highlights.push(`${counts.hospital} hospital${counts.hospital > 1 ? 's' : ''} within local reach`)
  }

  if (counts.shopping_mall || counts.grocery) {
    highlights.push(`${(counts.shopping_mall || 0) + (counts.grocery || 0)} retail and grocery options close by`)
  }

  if (counts.transport) {
    highlights.push(`${counts.transport} transport point${counts.transport > 1 ? 's' : ''} nearby`)
  }

  return highlights.slice(0, 4)
}

function buildSummary(property, profile, scores, nearbyPlaces) {
  const nearestSchool = nearbyPlaces
    .filter((place) => place.category === 'school' || place.category === 'college')
    .sort((a, b) => a.distanceMeters - b.distanceMeters)[0]
  const nearestHospital = nearbyPlaces
    .filter((place) => place.category === 'hospital')
    .sort((a, b) => a.distanceMeters - b.distanceMeters)[0]

  const schoolText = nearestSchool ? `${nearestSchool.name} is about ${nearestSchool.distanceMeters}m away` : 'school access is moderate'
  const hospitalText = nearestHospital ? `${nearestHospital.name} is about ${nearestHospital.distanceMeters}m away` : 'hospital access is moderate'

  return `${profile.summary} For this listing in ${property?.location?.area || profile.displayName}, the curated local score suggests a walkability of ${scores.walkScore}/100 and a convenience profile of ${scores.convenienceScore}/100. Nearby context indicates ${schoolText}, while ${hospitalText}.`
}

export async function upsertUnsupportedNeighbourhoodInsight(property, message) {
  if (!property?._id) return null

  return NeighbourhoodInsight.findOneAndUpdate(
    { property: property._id },
    {
      property: property._id,
      area: property.location?.area || '',
      city: property.location?.city || '',
      supportedAreaKey: '',
      coverageStatus: 'unsupported',
      message,
      summary: '',
      walkScore: 0,
      transitScore: 0,
      bikeScore: 0,
      safetyIndex: 0,
      averageAge: null,
      schoolRating: 0,
      convenienceScore: 0,
      familyFriendlinessScore: 0,
      neighbourhoodHighlights: [],
      safetyNotes: [],
      nearbyPlaces: [],
      sourceMode: 'curated',
      lastUpdated: new Date()
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  )
}

export async function generateNeighbourhoodInsightForProperty(property) {
  if (!property?._id) return null

  const resolvedArea = resolveDhakaArea(property.location?.city, property.location?.area, property.location?.address)

  if (!resolvedArea.supported) {
    return upsertUnsupportedNeighbourhoodInsight(property, resolvedArea.reason)
  }

  const profile = getAreaProfile(resolvedArea.areaKey)

  if (!profile) {
    return upsertUnsupportedNeighbourhoodInsight(property, 'Neighbourhood Insights are not yet configured for this area.')
  }

  const nearbyPlaces = generateNearbyPlacesForProperty(property, profile)
  const scores = calculateInsightScores({ profile, nearbyPlaces })
  const neighbourhoodHighlights = buildHighlights(nearbyPlaces)
  const summary = buildSummary(property, profile, scores, nearbyPlaces)

  return NeighbourhoodInsight.findOneAndUpdate(
    { property: property._id },
    {
      property: property._id,
      area: profile.displayName,
      city: 'Dhaka',
      supportedAreaKey: resolvedArea.areaKey,
      coverageStatus: 'ready',
      message: 'Neighbourhood insights were generated from curated Dhaka area profiles and nearby place templates for development use.',
      summary,
      ...scores,
      neighbourhoodHighlights,
      safetyNotes: profile.safetyNotes || [],
      nearbyPlaces,
      sourceMode: 'curated',
      lastUpdated: new Date()
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  )
}

export async function deleteNeighbourhoodInsightForProperty(propertyId) {
  if (!propertyId) return null
  return NeighbourhoodInsight.deleteOne({ property: propertyId })
}
