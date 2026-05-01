import mongoose from 'mongoose'
import Property from '../models/Property.js'
import PropertyAnalyticsEvent from '../models/PropertyAnalyticsEvent.js'
import {
  buildListingSuggestions,
  emptyMetricCounts,
  getAnalyticsDateRange,
  summarizeEvents,
  trackPropertyEvent
} from '../services/analytics/propertyAnalyticsService.js'

function toObjectId(value) {
  if (!mongoose.Types.ObjectId.isValid(String(value))) return null
  return new mongoose.Types.ObjectId(String(value))
}

function compactProperty(property) {
  if (!property) return null
  return {
    _id: property._id,
    title: property.title,
    image: property.image,
    images: property.images,
    imageAlt: property.imageAlt,
    price: property.price,
    salePrice: property.salePrice,
    rentPrice: property.rentPrice,
    listingType: property.listingType,
    propertyType: property.propertyType,
    status: property.status,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    squareFeet: property.squareFeet,
    location: property.location,
    amenities: property.amenities,
    description: property.description,
    arAssets: property.arAssets,
    updatedAt: property.updatedAt,
    createdAt: property.createdAt
  }
}

function sortPropertiesByPerformance(items) {
  return [...items].sort((first, second) => {
    const firstScore =
      first.analytics.views +
      first.analytics.favorites * 3 +
      first.analytics.requests * 8 +
      first.analytics.messages * 5 +
      first.analytics.designRoomOpens * 2 +
      first.analytics.compareAdds * 4

    const secondScore =
      second.analytics.views +
      second.analytics.favorites * 3 +
      second.analytics.requests * 8 +
      second.analytics.messages * 5 +
      second.analytics.designRoomOpens * 2 +
      second.analytics.compareAdds * 4

    return secondScore - firstScore
  })
}

function buildMetricSummaryForProperties(properties = [], events = []) {
  const eventsByProperty = new Map()

  events.forEach((event) => {
    const key = String(event.property)
    if (!eventsByProperty.has(key)) eventsByProperty.set(key, [])
    eventsByProperty.get(key).push(event)
  })

  return properties.map((property) => {
    const propertyEvents = eventsByProperty.get(String(property._id)) || []
    const analytics = summarizeEvents(propertyEvents)
    return {
      property: compactProperty(property),
      analytics,
      suggestions: buildListingSuggestions(property, analytics)
    }
  })
}

function addDays(date, count) {
  const next = new Date(date)
  next.setDate(next.getDate() + count)
  return next
}

function buildDailyActivity(events = [], days = 30) {
  const today = new Date()
  const start = new Date(today)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (days - 1))

  const buckets = new Map()
  for (let index = 0; index < days; index += 1) {
    const date = addDays(start, index)
    const key = date.toISOString().slice(0, 10)
    buckets.set(key, {
      date: key,
      views: 0,
      requests: 0,
      favorites: 0,
      messages: 0,
      designRoomOpens: 0,
      compareAdds: 0
    })
  }

  events.forEach((event) => {
    const key = new Date(event.createdAt).toISOString().slice(0, 10)
    const bucket = buckets.get(key)
    if (!bucket) return

    if (event.eventType === 'view') bucket.views += 1
    if (event.eventType === 'request_submit') bucket.requests += 1
    if (event.eventType === 'favorite') bucket.favorites += 1
    if (event.eventType === 'message_inquiry') bucket.messages += 1
    if (event.eventType === 'design_room_open') bucket.designRoomOpens += 1
    if (event.eventType === 'compare_add') bucket.compareAdds += 1
  })

  return [...buckets.values()]
}

export async function trackAnalyticsEvent(req, res) {
  try {
    const { propertyId, eventType, sessionId, metadata } = req.body || {}

    await trackPropertyEvent({
      propertyId,
      eventType,
      sessionId,
      metadata,
      userId: req.user?.userId || null
    })

    res.status(201).json({ success: true })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to track analytics event.' })
  }
}

export async function getManagerAnalyticsOverview(req, res) {
  try {
    const managerObjectId = toObjectId(req.user.userId)
    if (!managerObjectId) {
      return res.status(400).json({ message: 'Invalid manager id.' })
    }

    const { days, since } = getAnalyticsDateRange(req.query.days || 30)
    const properties = await Property.find({
      manager: managerObjectId,
      status: { $ne: 'deleted' }
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean()

    const propertyIds = properties.map((property) => property._id)
    const events = propertyIds.length
      ? await PropertyAnalyticsEvent.find({
          manager: managerObjectId,
          property: { $in: propertyIds },
          createdAt: { $gte: since }
        }).lean()
      : []

    const summary = summarizeEvents(events)
    summary.totalProperties = properties.length
    summary.activeProperties = properties.filter((property) => property.status === 'active').length

    const propertyMetrics = buildMetricSummaryForProperties(properties, events)
    const sortedProperties = sortPropertiesByPerformance(propertyMetrics)
    const attentionNeeded = propertyMetrics.filter((item) => (
      item.property.status === 'active' &&
      (item.analytics.views < 5 || (item.analytics.views >= 30 && item.analytics.requests < 2))
    ))

    res.status(200).json({
      success: true,
      rangeDays: days,
      summary,
      topProperties: sortedProperties.slice(0, 5),
      attentionNeeded: attentionNeeded.slice(0, 5),
      properties: sortedProperties
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load manager analytics overview.' })
  }
}

export async function getManagerPropertyAnalyticsList(req, res) {
  try {
    const managerObjectId = toObjectId(req.user.userId)
    if (!managerObjectId) {
      return res.status(400).json({ message: 'Invalid manager id.' })
    }

    const { days, since } = getAnalyticsDateRange(req.query.days || 30)
    const properties = await Property.find({
      manager: managerObjectId,
      status: { $ne: 'deleted' }
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean()

    const propertyIds = properties.map((property) => property._id)
    const events = propertyIds.length
      ? await PropertyAnalyticsEvent.find({
          manager: managerObjectId,
          property: { $in: propertyIds },
          createdAt: { $gte: since }
        }).lean()
      : []

    const propertiesWithAnalytics = sortPropertiesByPerformance(buildMetricSummaryForProperties(properties, events))

    res.status(200).json({
      success: true,
      rangeDays: days,
      properties: propertiesWithAnalytics
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load property analytics.' })
  }
}

export async function getManagerPropertyAnalytics(req, res) {
  try {
    const managerObjectId = toObjectId(req.user.userId)
    const propertyObjectId = toObjectId(req.params.propertyId)

    if (!managerObjectId || !propertyObjectId) {
      return res.status(400).json({ message: 'Invalid analytics request.' })
    }

    const { days, since } = getAnalyticsDateRange(req.query.days || 30)
    const property = await Property.findOne({
      _id: propertyObjectId,
      manager: managerObjectId,
      status: { $ne: 'deleted' }
    }).lean()

    if (!property) {
      return res.status(404).json({ message: 'Property not found or you do not own this listing.' })
    }

    const events = await PropertyAnalyticsEvent.find({
      property: propertyObjectId,
      manager: managerObjectId,
      createdAt: { $gte: since }
    })
      .sort({ createdAt: -1 })
      .lean()

    const analytics = summarizeEvents(events)
    const suggestions = buildListingSuggestions(property, analytics)
    const dailyActivity = buildDailyActivity(events, days)

    res.status(200).json({
      success: true,
      rangeDays: days,
      property: compactProperty(property),
      analytics: analytics || emptyMetricCounts(),
      suggestions,
      dailyActivity,
      recentEvents: events.slice(0, 20).map((event) => ({
        _id: event._id,
        eventType: event.eventType,
        createdAt: event.createdAt,
        metadata: event.metadata || {}
      }))
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load this property analytics.' })
  }
}
