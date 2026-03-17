import Property from '../models/Property.js'
import SearchQuery from '../models/SearchQuery.js'

const DHAKA_CENTER = {
  latitude: 23.8103,
  longitude: 90.4125
}

function parseNumber(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function buildBoundsFilter({ northEastLat, northEastLng, southWestLat, southWestLng }) {
  const hasBounds = [northEastLat, northEastLng, southWestLat, southWestLng].every((value) => value !== undefined)

  if (!hasBounds) return null

  const neLat = Number(northEastLat)
  const neLng = Number(northEastLng)
  const swLat = Number(southWestLat)
  const swLng = Number(southWestLng)

  if (![neLat, neLng, swLat, swLng].every(Number.isFinite)) return null

  return {
    'location.latitude': { $gte: swLat, $lte: neLat },
    'location.longitude': { $gte: swLng, $lte: neLng }
  }
}

export async function getMapProperties(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10))
    const limit = Math.min(30, Math.max(1, parseInt(req.query.limit || '9', 10)))
    const search = (req.query.search || '').trim()
    const area = (req.query.area || '').trim()
    const source = req.query.source || 'search'
    const lat = parseNumber(req.query.lat, DHAKA_CENTER.latitude)
    const lng = parseNumber(req.query.lng, DHAKA_CENTER.longitude)
    const zoom = parseNumber(req.query.zoom, 12)

    const filter = { status: 'active' }
    const textConditions = []

    if (search) {
      const searchRegex = new RegExp(search, 'i')
      textConditions.push(
        { title: searchRegex },
        { description: searchRegex },
        { 'location.area': searchRegex },
        { 'location.address': searchRegex },
        { 'location.city': searchRegex },
        { propertyType: searchRegex }
      )
    }

    if (area) {
      textConditions.push({ 'location.area': new RegExp(`^${area}$`, 'i') })
    }

    if (textConditions.length) {
      filter.$or = textConditions
    }

    const boundsFilter = buildBoundsFilter(req.query)
    if (boundsFilter) {
      Object.assign(filter, boundsFilter)
    }

    const total = await Property.countDocuments(filter)
    const properties = await Property.find(filter)
      .sort({ price: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    await SearchQuery.create({
      user: req.user?.userId || null,
      searchText: search,
      area,
      center: {
        latitude: lat,
        longitude: lng
      },
      zoom,
      page,
      resultCount: total,
      source
    }).catch(() => null)

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
        area: area || 'Dhaka',
        search
      }
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load map properties' })
  }
}

export async function getPropertyById(req, res) {
  try {
    const property = await Property.findById(req.params.id).populate('manager', 'name email role').lean()

    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
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
