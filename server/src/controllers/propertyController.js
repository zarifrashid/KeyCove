import Property from '../models/Property.js'
import SearchQuery from '../models/SearchQuery.js'
import { buildPropertyFilter, extractSearchSnapshot } from '../utils/searchFilters.js'
import { buildSortOption } from '../utils/searchSort.js'

const DHAKA_CENTER = {
  latitude: 23.8103,
  longitude: 90.4125
}

function parseNumber(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
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
    const sortOption = req.query.sort || 'newest'
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
