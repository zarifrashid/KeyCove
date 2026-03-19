import jwt from 'jsonwebtoken'
import Property from '../models/Property.js'
import SearchQuery from '../models/SearchQuery.js'
import { buildPropertyFilter, extractSearchSnapshot } from '../utils/searchFilters.js'
import { buildSortOption, normalizeSortOption } from '../utils/searchSort.js'

const DHAKA_CENTER = {
  latitude: 23.8103,
  longitude: 90.4125
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'

function parseNumber(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseOptionalNumber(value, fallback = null) {
  if (value === '' || value === null || value === undefined) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeString(value, fallback = '') {
  if (value === null || value === undefined) return fallback
  return String(value).trim()
}

function normalizeAmenities(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

function normalizeImages(value) {
  if (Array.isArray(value)) {
    return value
      .map((item, index) => {
        const url = typeof item === 'string' ? item.trim() : String(item?.url || '').trim()
        if (!url) return null
        return {
          url,
          sortOrder: index,
          uploadedAt: new Date()
        }
      })
      .filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item, index) => item.trim() ? ({ url: item.trim(), sortOrder: index, uploadedAt: new Date() }) : null)
      .filter(Boolean)
  }

  return []
}

function buildGeoLocation(latitude, longitude) {
  const lat = parseOptionalNumber(latitude, DHAKA_CENTER.latitude)
  const lng = parseOptionalNumber(longitude, DHAKA_CENTER.longitude)

  return {
    type: 'Point',
    coordinates: [lng, lat]
  }
}

function buildLocation(payload = {}, currentLocation = {}) {
  const latitude = parseOptionalNumber(payload.latitude, currentLocation.latitude)
  const longitude = parseOptionalNumber(payload.longitude, currentLocation.longitude)

  return {
    address: normalizeString(payload.address, currentLocation.address || ''),
    area: normalizeString(payload.area, currentLocation.area || ''),
    city: normalizeString(payload.city, currentLocation.city || 'Dhaka') || 'Dhaka',
    postalCode: normalizeString(payload.postalCode, currentLocation.postalCode || ''),
    latitude,
    longitude
  }
}

function validatePublishedProperty(payload) {
  const errors = []

  if (!normalizeString(payload.title)) errors.push('Title is required to publish.')
  if (!normalizeString(payload.description)) errors.push('Description is required to publish.')

  const price = parseOptionalNumber(payload.price)
  if (price === null || price <= 0) errors.push('Price must be greater than 0 to publish.')

  const image = normalizeString(payload.image)
  if (!image) errors.push('Cover image URL is required to publish.')

  const bedrooms = parseOptionalNumber(payload.bedrooms)
  if (bedrooms === null || bedrooms < 0) errors.push('Bedroom number must be 0 or more.')

  const bathrooms = parseOptionalNumber(payload.bathrooms)
  if (bathrooms === null || bathrooms < 0) errors.push('Bathroom number must be 0 or more.')

  const squareFeet = parseOptionalNumber(payload.squareFeet)
  if (squareFeet === null || squareFeet <= 0) errors.push('Total size must be greater than 0.')

  const location = payload.location || {}
  if (!normalizeString(location.address)) errors.push('Address is required to publish.')
  if (!normalizeString(location.area)) errors.push('Area is required to publish.')
  if (!normalizeString(location.city)) errors.push('City is required to publish.')

  const latitude = parseOptionalNumber(location.latitude)
  const longitude = parseOptionalNumber(location.longitude)
  if (latitude === null || latitude < -90 || latitude > 90) errors.push('Latitude must be a valid number between -90 and 90.')
  if (longitude === null || longitude < -180 || longitude > 180) errors.push('Longitude must be a valid number between -180 and 180.')

  return errors
}

function extractBody(req) {
  return req.body && typeof req.body === 'object' ? req.body : {}
}

function buildPropertyPayload(payload, currentProperty = null, managerId) {
  const location = buildLocation(payload.location, currentProperty?.location || {})
  const nextImages = normalizeImages(payload.images)
  const nextImage = normalizeString(payload.image, currentProperty?.image || '') || nextImages[0]?.url || FALLBACK_IMAGE
  const action = normalizeString(payload.action, currentProperty?.status === 'active' ? 'publish' : 'draft').toLowerCase()
  const shouldPublish = action === 'publish'

  return {
    title: normalizeString(payload.title, currentProperty?.title || ''),
    description: normalizeString(payload.description, currentProperty?.description || ''),
    price: parseOptionalNumber(payload.price, currentProperty?.price ?? 0) ?? 0,
    propertyType: normalizeString(payload.propertyType, currentProperty?.propertyType || 'Apartment') || 'Apartment',
    listingType: normalizeString(payload.listingType, currentProperty?.listingType || 'rent') || 'rent',
    status: shouldPublish ? 'active' : 'draft',
    bedrooms: parseOptionalNumber(payload.bedrooms, currentProperty?.bedrooms ?? 1) ?? 1,
    bathrooms: parseOptionalNumber(payload.bathrooms, currentProperty?.bathrooms ?? 1) ?? 1,
    squareFeet: parseOptionalNumber(payload.squareFeet, currentProperty?.squareFeet ?? 600) ?? 600,
    availableFrom: payload.availableFrom ? new Date(payload.availableFrom) : currentProperty?.availableFrom || new Date(),
    image: nextImage,
    imageAlt: normalizeString(payload.imageAlt, payload.title || currentProperty?.imageAlt || 'Property photo') || 'Property photo',
    images: nextImages.length ? nextImages : currentProperty?.images || (nextImage ? [{ url: nextImage, sortOrder: 0, uploadedAt: new Date() }] : []),
    manager: managerId,
    amenities: normalizeAmenities(payload.amenities),
    policies: {
      utilities: normalizeString(payload.policies?.utilities, currentProperty?.policies?.utilities || ''),
      pet: normalizeString(payload.policies?.pet, currentProperty?.policies?.pet || ''),
      income: normalizeString(payload.policies?.income, currentProperty?.policies?.income || '')
    },
    nearbyPlaces: {
      school: normalizeString(payload.nearbyPlaces?.school, currentProperty?.nearbyPlaces?.school || ''),
      bus: normalizeString(payload.nearbyPlaces?.bus, currentProperty?.nearbyPlaces?.bus || ''),
      restaurant: normalizeString(payload.nearbyPlaces?.restaurant, currentProperty?.nearbyPlaces?.restaurant || '')
    },
    location,
    geoLocation: buildGeoLocation(location.latitude, location.longitude)
  }
}

async function logSearchQuery({ req, total, page, limit, sortOption, source, zoom }) {
  const snapshot = extractSearchSnapshot(req.query)

  await SearchQuery.create({
    user: req.user?.userId || null,
    searchText: snapshot.searchText,
    area: snapshot.area,
    center: {
      latitude: snapshot.center.latitude ?? DHAKA_CENTER.latitude,
      longitude: snapshot.center.longitude ?? DHAKA_CENTER.longitude
    },
    bounds: snapshot.bounds,
    filters: snapshot.filters,
    sortOption,
    zoom,
    page,
    pageSize: limit,
    resultCount: total,
    source
  }).catch(() => null)
}

export async function searchProperties(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10))
    const limit = Math.min(30, Math.max(1, parseInt(req.query.limit || '9', 10)))
    const source = req.query.source || 'search'
    const sortOption = normalizeSortOption(req.query.sort || 'newest')
    const lat = parseNumber(req.query.lat, DHAKA_CENTER.latitude)
    const lng = parseNumber(req.query.lng, DHAKA_CENTER.longitude)
    const zoom = parseNumber(req.query.zoom, 12)

    const filter = buildPropertyFilter(req.query)
    const sort = buildSortOption(sortOption)

    const [total, properties] = await Promise.all([
      Property.countDocuments(filter),
      Property.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
    ])

    await logSearchQuery({ req, total, page, limit, sortOption, source, zoom })

    res.status(200).json({
      success: true,
      properties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      },
      meta: {
        center: { latitude: lat, longitude: lng },
        zoom,
        area: req.query.area || 'Dhaka',
        search: req.query.search || '',
        sort: sortOption
      }
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to search properties' })
  }
}

export const getMapProperties = searchProperties

function getOptionalRequesterId(req) {
  const token = req.cookies?.token
  if (!token) return null

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallbacksecret')
    return decoded.userId || null
  } catch (_) {
    return null
  }
}

export async function getPropertyById(req, res) {
  try {
    const property = await Property.findById(req.params.id).populate('manager', 'name email role').lean()

    if (!property || property.status === 'deleted') {
      return res.status(404).json({ message: 'Property not found' })
    }

    if (property.status !== 'active') {
      const requesterId = getOptionalRequesterId(req)
      const ownerId = property.manager?._id ? property.manager._id.toString() : property.manager?.toString?.()

      if (!requesterId || requesterId !== ownerId) {
        return res.status(404).json({ message: 'Property not found' })
      }
    }

    res.status(200).json({ success: true, property })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch property details' })
  }
}

export async function getMapStats(req, res) {
  try {
    const totalActive = await Property.countDocuments({ status: 'active' })
    const areaBreakdown = await Property.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$location.area', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])

    res.status(200).json({
      success: true,
      totalActive,
      areaBreakdown
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch map stats' })
  }
}

export async function getMyProperties(req, res) {
  try {
    const properties = await Property.find({
      manager: req.user.userId,
      status: { $ne: 'deleted' }
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean()

    res.status(200).json({
      success: true,
      properties
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch manager properties' })
  }
}

export async function createProperty(req, res) {
  try {
    const rawPayload = extractBody(req)
    const payload = buildPropertyPayload(rawPayload, null, req.user.userId)

    if (payload.status === 'active') {
      const publishErrors = validatePublishedProperty(payload)
      if (publishErrors.length) {
        return res.status(400).json({ message: publishErrors[0], errors: publishErrors })
      }
    }

    const property = await Property.create(payload)

    res.status(201).json({
      success: true,
      message: payload.status === 'active' ? 'Property published successfully.' : 'Property saved as draft.',
      property
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create property' })
  }
}

export async function updateProperty(req, res) {
  try {
    const existingProperty = await Property.findById(req.params.id)

    if (!existingProperty || existingProperty.status === 'deleted') {
      return res.status(404).json({ message: 'Property not found' })
    }

    if (existingProperty.manager.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You can only update your own property listings.' })
    }

    const rawPayload = extractBody(req)
    const payload = buildPropertyPayload(rawPayload, existingProperty, req.user.userId)

    if (payload.status === 'active') {
      const publishErrors = validatePublishedProperty(payload)
      if (publishErrors.length) {
        return res.status(400).json({ message: publishErrors[0], errors: publishErrors })
      }
    }

    Object.assign(existingProperty, payload)
    await existingProperty.save()

    res.status(200).json({
      success: true,
      message: payload.status === 'active' ? 'Property updated and published successfully.' : 'Draft updated successfully.',
      property: existingProperty
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update property' })
  }
}

export async function deleteProperty(req, res) {
  try {
    const property = await Property.findById(req.params.id)

    if (!property || property.status === 'deleted') {
      return res.status(404).json({ message: 'Property not found' })
    }

    if (property.manager.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You can only delete your own property listings.' })
    }

    property.status = 'deleted'
    await property.save()

    res.status(200).json({
      success: true,
      message: 'Property deleted successfully.'
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete property' })
  }
}
