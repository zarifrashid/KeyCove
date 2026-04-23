import InteractionLog from '../../models/InteractionLog.js'
import Property from '../../models/Property.js'

function toObjectId(value) {
  return value || null
}

function buildPropertyMetadata(property) {
  if (!property) return {}

  return {
    area: property.location?.area || '',
    propertyType: property.propertyType || '',
    listingType: property.listingType || '',
    price: property.price ?? null
  }
}

export async function logInteraction({
  userId,
  interactionType,
  propertyId = null,
  source = '',
  searchSnapshot = null,
  recommendationId = null,
  algorithmVersion = '',
  metadata = null
}) {
  if (!userId || !interactionType) return null

  let property = null
  if (propertyId) {
    property = await Property.findById(propertyId)
      .select('location.area propertyType listingType price')
      .lean()
      .catch(() => null)
  }

  return InteractionLog.create({
    user: toObjectId(userId),
    property: toObjectId(propertyId),
    interactionType,
    source,
    searchSnapshot,
    recommendationContext: {
      recommendationId: recommendationId || null,
      algorithmVersion
    },
    metadata: {
      ...buildPropertyMetadata(property),
      ...(metadata || {})
    }
  }).catch(() => null)
}
