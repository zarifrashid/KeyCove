import mongoose from 'mongoose'
import Property from '../../models/Property.js'
import PropertyAnalyticsEvent, { PROPERTY_ANALYTICS_EVENT_TYPES } from '../../models/PropertyAnalyticsEvent.js'

function isValidObjectId(value) {
  return value && mongoose.Types.ObjectId.isValid(String(value))
}

function toObjectId(value) {
  return isValidObjectId(value) ? new mongoose.Types.ObjectId(String(value)) : null
}

function normalizeString(value, fallback = '') {
  if (value === null || value === undefined) return fallback
  return String(value).trim()
}

function isSameId(first, second) {
  if (!first || !second) return false
  return String(first) === String(second)
}

export function getAnalyticsDateRange(days = 30) {
  const parsed = Number(days)
  const safeDays = Number.isFinite(parsed) ? Math.min(365, Math.max(1, parsed)) : 30
  return {
    days: safeDays,
    since: new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000)
  }
}

export function emptyMetricCounts() {
  return {
    views: 0,
    uniqueViewers: 0,
    favorites: 0,
    unfavorites: 0,
    requests: 0,
    messages: 0,
    designRoomOpens: 0,
    compareAdds: 0,
    compareRemoves: 0,
    conversionRate: '0.0'
  }
}

function addUniqueViewer(uniqueViewers, event) {
  if (event.user) {
    uniqueViewers.add(`user:${String(event.user)}`)
    return
  }

  if (event.sessionId) {
    uniqueViewers.add(`session:${event.sessionId}`)
  }
}

export function summarizeEvents(events = []) {
  const counts = emptyMetricCounts()
  const uniqueViewers = new Set()

  events.forEach((event) => {
    switch (event.eventType) {
      case 'view':
        counts.views += 1
        addUniqueViewer(uniqueViewers, event)
        break
      case 'favorite':
        counts.favorites += 1
        break
      case 'unfavorite':
        counts.unfavorites += 1
        break
      case 'request_submit':
        counts.requests += 1
        break
      case 'message_inquiry':
        counts.messages += 1
        break
      case 'design_room_open':
        counts.designRoomOpens += 1
        break
      case 'compare_add':
        counts.compareAdds += 1
        break
      case 'compare_remove':
        counts.compareRemoves += 1
        break
      default:
        break
    }
  })

  counts.uniqueViewers = uniqueViewers.size
  counts.conversionRate = counts.views > 0 ? ((counts.requests / counts.views) * 100).toFixed(1) : '0.0'
  return counts
}

function getImageCount(property) {
  const images = Array.isArray(property?.images) ? property.images.filter((item) => item?.url).length : 0
  return Math.max(images, property?.image ? 1 : 0)
}

function getAmenityCount(property) {
  return Array.isArray(property?.amenities) ? property.amenities.filter(Boolean).length : 0
}

function hasRoomDimensions(property) {
  return Array.isArray(property?.arAssets?.roomTemplates) && property.arAssets.roomTemplates.length > 0
}

export function buildListingSuggestions(property, metrics = emptyMetricCounts()) {
  const suggestions = []
  const imageCount = getImageCount(property)
  const amenityCount = getAmenityCount(property)
  const descriptionLength = normalizeString(property?.description).length

  if (metrics.views >= 30 && metrics.requests < 2) {
    suggestions.push('This listing is getting views but few requests. Review the price, images, and description to improve conversion.')
  }

  if (metrics.favorites >= 8 && metrics.messages < 2) {
    suggestions.push('Tenants are saving this property but not contacting you. Add clearer availability details or a stronger call-to-action.')
  }

  if (metrics.views < 5 && String(property?.status || '') === 'active') {
    suggestions.push('This active listing has low visibility. Improve the title, area details, and listing completeness to attract more tenants.')
  }

  if (imageCount < 4) {
    suggestions.push('Upload at least 4 high-quality images to build trust and improve engagement.')
  }

  if (descriptionLength < 90) {
    suggestions.push('Add a more detailed description explaining layout, nearby facilities, building rules, and special advantages.')
  }

  if (amenityCount < 3) {
    suggestions.push('Add more amenities so tenants can understand the lifestyle and building facilities faster.')
  }

  if (!hasRoomDimensions(property)) {
    suggestions.push('Add room dimensions to improve Design Rooms, listing confidence, and space-planning value.')
  }

  if (metrics.designRoomOpens === 0 && hasRoomDimensions(property)) {
    suggestions.push('Design Rooms are available but not being opened. Make the Design Rooms button more visible in your listing presentation.')
  }

  if (!suggestions.length) {
    suggestions.push('This listing has a healthy setup. Keep images, pricing, and availability updated to maintain tenant confidence.')
  }

  return suggestions.slice(0, 5)
}

export async function trackPropertyEvent({ propertyId, userId = null, eventType, sessionId = '', metadata = {} }) {
  if (!propertyId || !eventType || !PROPERTY_ANALYTICS_EVENT_TYPES.includes(eventType)) return null
  if (!isValidObjectId(propertyId)) return null

  const property = await Property.findById(propertyId).select('_id manager status').lean()
  if (!property || property.status === 'deleted') return null

  if (userId && isSameId(property.manager, userId)) {
    return null
  }

  const cleanSessionId = normalizeString(sessionId).slice(0, 120)
  const userObjectId = toObjectId(userId)

  if (eventType === 'view') {
    const since = new Date(Date.now() - 30 * 60 * 1000)
    const duplicateFilters = []

    if (userObjectId) duplicateFilters.push({ user: userObjectId })
    if (cleanSessionId) duplicateFilters.push({ sessionId: cleanSessionId })

    if (duplicateFilters.length) {
      const duplicate = await PropertyAnalyticsEvent.findOne({
        property: property._id,
        eventType: 'view',
        createdAt: { $gte: since },
        $or: duplicateFilters
      })

      if (duplicate) return duplicate
    }
  }

  return PropertyAnalyticsEvent.create({
    property: property._id,
    manager: property.manager,
    user: userObjectId,
    eventType,
    sessionId: cleanSessionId,
    metadata: metadata && typeof metadata === 'object' ? metadata : {}
  })
}
