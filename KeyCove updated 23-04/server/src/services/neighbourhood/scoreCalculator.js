function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value))
}

function scoreContribution(distanceMeters, weight, maxDistance = 2000) {
  const distanceFactor = clamp(1 - distanceMeters / maxDistance, 0, 1)
  return distanceFactor * weight
}

const WALK_WEIGHTS = {
  school: 4,
  college: 3,
  mosque: 2,
  hospital: 4,
  shopping_mall: 4,
  park: 4,
  restaurant: 3,
  transport: 5,
  grocery: 4,
  pharmacy: 4,
  other: 1
}

const TRANSIT_WEIGHTS = {
  transport: 9,
  shopping_mall: 1,
  hospital: 1,
  other: 1
}

const FAMILY_WEIGHTS = {
  school: 5,
  college: 3,
  hospital: 4,
  park: 5,
  mosque: 2,
  grocery: 2,
  shopping_mall: 2,
  pharmacy: 3
}

export function calculateInsightScores({ profile, nearbyPlaces }) {
  const baseline = profile?.baselineScores || {}

  const walkBoost = nearbyPlaces.reduce((total, place) => total + scoreContribution(place.distanceMeters, WALK_WEIGHTS[place.category] || 1, 2000), 0)
  const transitBoost = nearbyPlaces.reduce((total, place) => total + scoreContribution(place.distanceMeters, TRANSIT_WEIGHTS[place.category] || 0, 1800), 0)
  const familyBoost = nearbyPlaces.reduce((total, place) => total + scoreContribution(place.distanceMeters, FAMILY_WEIGHTS[place.category] || 0, 2200), 0)
  const schoolPlaces = nearbyPlaces.filter((place) => place.category === 'school' || place.category === 'college')
  const hospitalPlaces = nearbyPlaces.filter((place) => place.category === 'hospital')
  const parkPlaces = nearbyPlaces.filter((place) => place.category === 'park')

  const walkScore = Math.round(clamp((baseline.walk || 0) + walkBoost, 0, 100))
  const transitScore = Math.round(clamp((baseline.transit || 0) + transitBoost, 0, 100))
  const bikeScore = Math.round(clamp((baseline.bike || 0) + parkPlaces.length * 2, 0, 100))
  const safetyIndex = Math.round(clamp((baseline.safety || 0) + hospitalPlaces.length * 1.5 + parkPlaces.length * 0.5, 0, 100))
  const convenienceScore = Math.round(clamp((baseline.convenience || 0) + walkBoost * 0.6 + transitBoost * 0.8, 0, 100))
  const familyFriendlinessScore = Math.round(clamp((baseline.family || 0) + familyBoost, 0, 100))
  const schoolRating = Number(clamp((baseline.schoolRating || 0) + schoolPlaces.length * 0.08, 0, 5).toFixed(1))

  return {
    walkScore,
    transitScore,
    bikeScore,
    safetyIndex,
    schoolRating,
    convenienceScore,
    familyFriendlinessScore,
    averageAge: baseline.averageAge ?? null
  }
}
