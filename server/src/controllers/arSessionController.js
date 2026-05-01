import mongoose from 'mongoose'
import ARSession from '../models/ARSession.js'
import Property from '../models/Property.js'
import { trackPropertyEvent } from '../services/analytics/propertyAnalyticsService.js'

const MAX_FURNITURE_ITEMS = 70
const MAX_INTERACTION_LOGS = 200

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value)
}

function toNumber(value, fallback, min = -Infinity, max = Infinity) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(parsed, min), max)
}

function cleanString(value, fallback = '') {
  if (value === null || value === undefined) return fallback
  return String(value).trim()
}

function cleanVector(value = {}, fallback = { x: 0, y: 0, z: 0 }) {
  return {
    x: toNumber(value.x, fallback.x),
    y: toNumber(value.y, fallback.y),
    z: toNumber(value.z, fallback.z)
  }
}

function cleanPlacement(item = {}, index = 0) {
  const width = toNumber(item.dimensions?.width, 80, 20, 300)
  const depth = toNumber(item.dimensions?.depth, 50, 20, 300)
  const height = toNumber(item.dimensions?.height, 40, 5, 300)

  return {
    furnitureId: cleanString(item.furnitureId, `furniture-${index + 1}`),
    roomId: cleanString(item.roomId, 'living-room'),
    name: cleanString(item.name, 'Furniture'),
    category: cleanString(item.category, 'general'),
    itemType: cleanString(item.itemType, 'furniture'),
    modelUrl: cleanString(item.modelUrl),
    imageUrl: '',
    icon: cleanString(item.icon, '▣'),
    color: cleanString(item.color, '#0f4c81'),
    position: cleanVector(item.position, { x: 0, y: 0, z: 0 }),
    rotation: cleanVector(item.rotation, { x: 0, y: 0, z: 0 }),
    scale: cleanVector(item.scale, { x: 1, y: 1, z: 1 }),
    dimensions: { width, depth, height }
  }
}

function cleanLog(item = {}) {
  const allowedTypes = new Set(['open', 'add-furniture', 'move', 'rotate', 'scale', 'reset', 'save', 'fullscreen', 'load', 'room-switch', 'duplicate', 'delete', 'reset-to-default'])
  const type = cleanString(item.type)
  if (!allowedTypes.has(type)) return null

  return {
    type,
    metadata: item.metadata && typeof item.metadata === 'object' ? item.metadata : {},
    createdAt: item.createdAt ? new Date(item.createdAt) : new Date()
  }
}

function cleanViewState(value = {}) {
  return {
    cameraMode: cleanString(value.cameraMode, 'planner'),
    zoom: toNumber(value.zoom, 1, 0.25, 5),
    activeRoomId: cleanString(value.activeRoomId, 'living-room'),
    lastSelectedFurnitureId: cleanString(value.lastSelectedFurnitureId)
  }
}

function isPropertyManager(property, userId) {
  return property?.manager?.toString?.() === userId || String(property?.manager || '') === userId
}

function publicSession(session) {
  if (!session) return null
  return typeof session.toObject === 'function' ? session.toObject() : session
}

export async function getARSessionByProperty(req, res) {
  const { propertyId } = req.params

  if (!isValidObjectId(propertyId)) {
    return res.status(400).json({ message: 'Invalid property id.' })
  }

  const property = await Property.findById(propertyId).select('_id title manager arAssets')
  if (!property) {
    return res.status(404).json({ message: 'Property not found.' })
  }

  const userId = req.user.userId
  const isManagerOwner = req.user.role === 'manager' && isPropertyManager(property, userId)
  let defaultSession = await ARSession.findOne({ property: propertyId, scope: 'property_default', status: 'active' }).sort({ updatedAt: -1 })

  // Backward compatibility: layouts saved before scopes existed can still be used.
  if (!defaultSession && isManagerOwner) {
    defaultSession = await ARSession.findOne({ property: propertyId, user: userId, status: 'active' }).sort({ updatedAt: -1 })
  }

  let personalSession = null
  if (!isManagerOwner) {
    personalSession = await ARSession.findOne({ property: propertyId, user: userId, scope: 'user_custom', status: 'active' })
      || await ARSession.findOne({ property: propertyId, user: userId, scope: { $exists: false }, status: 'active' })
  }

  const session = isManagerOwner ? defaultSession : (personalSession || defaultSession)
  const source = isManagerOwner && defaultSession ? 'property_default' : personalSession ? 'user_custom' : defaultSession ? 'property_default' : 'empty'

  await trackPropertyEvent({
    propertyId,
    userId,
    eventType: 'design_room_open',
    metadata: { source }
  }).catch(() => null)

  return res.json({
    session: publicSession(session),
    source,
    defaultSession: publicSession(defaultSession),
    canEditDefault: isManagerOwner,
    arAssets: property.arAssets || {
      propertyModelUrl: '',
      floorPlanModelUrl: '',
      furnitureCatalog: [],
      roomTemplates: []
    }
  })
}

export async function saveARSession(req, res) {
  const payload = req.body && typeof req.body === 'object' ? req.body : {}
  const propertyId = payload.propertyId

  if (!isValidObjectId(propertyId)) {
    return res.status(400).json({ message: 'Invalid property id.' })
  }

  const property = await Property.findById(propertyId).select('_id manager')
  if (!property) {
    return res.status(404).json({ message: 'Property not found.' })
  }

  const userId = req.user.userId
  const isManagerOwner = req.user.role === 'manager' && isPropertyManager(property, userId)
  const requestedScope = cleanString(payload.scope, 'user_custom')
  const scope = isManagerOwner && requestedScope === 'property_default' ? 'property_default' : 'user_custom'

  if (requestedScope === 'property_default' && !isManagerOwner) {
    return res.status(403).json({ message: 'Only the listing manager can save the default furnished layout.' })
  }

  const furniturePlacements = Array.isArray(payload.furniturePlacements)
    ? payload.furniturePlacements.slice(0, MAX_FURNITURE_ITEMS).map(cleanPlacement)
    : []
  const incomingLogs = Array.isArray(payload.interactionLogs)
    ? payload.interactionLogs.map(cleanLog).filter(Boolean)
    : []

  const query = { property: propertyId, user: userId }
  const existing = await ARSession.findOne(query)
  const previousLogs = Array.isArray(existing?.interactionLogs) ? existing.interactionLogs : []
  const interactionLogs = [...previousLogs, ...incomingLogs].slice(-MAX_INTERACTION_LOGS)

  const session = await ARSession.findOneAndUpdate(
    query,
    {
      property: propertyId,
      user: userId,
      scope,
      furniturePlacements,
      interactionLogs,
      viewState: cleanViewState(payload.viewState),
      savedName: cleanString(payload.savedName, scope === 'property_default' ? 'Default furnished layout' : 'My saved room layout'),
      status: cleanString(payload.status, 'active') === 'archived' ? 'archived' : 'active'
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  )

  return res.status(200).json({
    message: scope === 'property_default' ? 'Default furnished layout saved for tenants.' : 'Your room design was saved.',
    session,
    scope
  })
}
