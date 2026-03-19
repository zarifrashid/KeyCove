function roundCoordinate(value) {
  return Number(value.toFixed(6))
}

function metersToLatOffset(meters) {
  return meters / 111320
}

function metersToLngOffset(meters, latitude) {
  const safeLatitude = Number.isFinite(latitude) ? latitude : 23.8103
  const divisor = 111320 * Math.cos((safeLatitude * Math.PI) / 180)
  return meters / (divisor || 111320)
}

function buildPlaceCoordinate(latitude, longitude, distanceMeters, index) {
  const bearing = ((index * 41) % 360) * (Math.PI / 180)
  const latOffset = metersToLatOffset(distanceMeters * Math.cos(bearing))
  const lngOffset = metersToLngOffset(distanceMeters * Math.sin(bearing), latitude)

  return {
    latitude: roundCoordinate(latitude + latOffset),
    longitude: roundCoordinate(longitude + lngOffset)
  }
}

export function generateNearbyPlacesForProperty(property, profile) {
  const latitude = Number(property?.location?.latitude)
  const longitude = Number(property?.location?.longitude)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !profile?.places?.length) {
    return []
  }

  return profile.places.map((place, index) => {
    const { latitude: placeLatitude, longitude: placeLongitude } = buildPlaceCoordinate(
      latitude,
      longitude,
      place.distanceMeters,
      index + 1
    )

    return {
      name: place.name,
      category: place.category,
      distanceMeters: place.distanceMeters,
      latitude: placeLatitude,
      longitude: placeLongitude,
      address: `${profile.displayName}, Dhaka`,
      source: 'curated'
    }
  })
}
