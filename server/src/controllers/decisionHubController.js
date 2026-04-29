import mongoose from 'mongoose'
import DecisionNote, { DECISION_TAG_OPTIONS, DECISION_VISIT_STATUSES } from '../models/DecisionNote.js'
import Property from '../models/Property.js'
import PropertyRequest from '../models/PropertyRequest.js'
import ARSession from '../models/ARSession.js'
import { calculateListingTrust } from '../services/decisionHub/trustScore.js'

const DEFAULT_CHECKLIST = [
  'Room size matches listing',
  'Photos match actual property',
  'Good sunlight',
  'Good ventilation',
  'Low noise level',
  'Water supply checked',
  'Gas/electricity checked',
  'Internet/mobile network checked',
  'Security checked',
  'Building condition checked',
  'Lift/stairs checked',
  'Parking checked',
  'Balcony usable',
  'Kitchen condition checked',
  'Bathroom condition checked',
  'Neighbourhood feels safe'
]

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value)
}

function defaultChecklist() {
  return DEFAULT_CHECKLIST.map((label) => ({ label, checked: false, note: '' }))
}

function makeDefaultNote(userId, propertyId) {
  return {
    userId,
    propertyId,
    visitStatus: 'not_visited',
    personalRating: null,
    pros: '',
    cons: '',
    questionsForManager: '',
    privateNotes: '',
    checklist: defaultChecklist(),
    decisionTags: [],
    compareSelected: false
  }
}

function cleanString(value) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function cleanRating(value) {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return null
  return Math.min(5, Math.max(1, Math.round(parsed)))
}

function cleanChecklist(value) {
  const incoming = Array.isArray(value) ? value : []
  const byLabel = new Map()

  incoming.forEach((item) => {
    const label = cleanString(item?.label)
    if (!label) return
    byLabel.set(label, {
      label,
      checked: Boolean(item?.checked),
      note: cleanString(item?.note)
    })
  })

  const mergedDefaults = defaultChecklist().map((item) => byLabel.get(item.label) || item)
  const customItems = [...byLabel.values()].filter((item) => !DEFAULT_CHECKLIST.includes(item.label)).slice(0, 10)
  return [...mergedDefaults, ...customItems].slice(0, 30)
}

function cleanTags(value = []) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map(cleanString).filter((tag) => DECISION_TAG_OPTIONS.includes(tag)))]
}

function cleanPayload(body = {}) {
  const visitStatus = DECISION_VISIT_STATUSES.includes(cleanString(body.visitStatus)) ? cleanString(body.visitStatus) : 'not_visited'

  return {
    visitStatus,
    personalRating: cleanRating(body.personalRating),
    pros: cleanString(body.pros),
    cons: cleanString(body.cons),
    questionsForManager: cleanString(body.questionsForManager),
    privateNotes: cleanString(body.privateNotes),
    checklist: cleanChecklist(body.checklist),
    decisionTags: cleanTags(body.decisionTags),
    compareSelected: Boolean(body.compareSelected)
  }
}

function noteObject(note) {
  if (!note) return null
  return typeof note.toObject === 'function' ? note.toObject() : note
}

function propertyIdString(propertyOrId) {
  if (!propertyOrId) return ''
  if (propertyOrId._id) return propertyOrId._id.toString()
  return propertyOrId.toString?.() || String(propertyOrId)
}

function managerOwnsProperty(property, userId) {
  const manager = property?.manager
  if (!manager) return false
  if (manager._id) return manager._id.toString() === userId
  return manager.toString?.() === userId || String(manager) === userId
}

async function getAccessibleProperty(propertyId, req, { allowManagerDraft = false } = {}) {
  if (!isValidObjectId(propertyId)) {
    return { error: { status: 400, message: 'Invalid property id.' } }
  }

  const property = await Property.findById(propertyId).populate('manager', 'name email role companyName verified isVerified verificationStatus').lean()

  if (!property || property.status === 'deleted') {
    return { error: { status: 404, message: 'Property not found.' } }
  }

  const isTenant = req.user?.role === 'tenant'
  const isManagerOwner = req.user?.role === 'manager' && managerOwnsProperty(property, req.user.userId)

  if (property.status !== 'active' && !(allowManagerDraft && isManagerOwner)) {
    return { error: { status: 404, message: 'Property not found.' } }
  }

  if (!isTenant && !isManagerOwner) {
    return { error: { status: 403, message: 'You do not have access to this property.' } }
  }

  return { property }
}

async function getDefaultDesignRoomSet(propertyIds = []) {
  const validIds = propertyIds.map((id) => propertyIdString(id)).filter(isValidObjectId)
  if (!validIds.length) return new Set()

  const sessions = await ARSession.find({
    property: { $in: validIds },
    scope: 'property_default',
    status: 'active'
  }).select('property').lean()

  return new Set(sessions.map((session) => propertyIdString(session.property)))
}

async function getApplicationStatusMap(userId, propertyIds = []) {
  const validIds = propertyIds.map((id) => propertyIdString(id)).filter(isValidObjectId)
  if (!validIds.length) return new Map()

  const requests = await PropertyRequest.find({
    tenant: userId,
    property: { $in: validIds }
  }).sort({ createdAt: -1 }).select('property status actionType occupancyStatus createdAt').lean()

  const map = new Map()
  requests.forEach((request) => {
    const key = propertyIdString(request.property)
    if (!map.has(key)) {
      map.set(key, {
        status: request.status || 'pending',
        actionType: request.actionType || '',
        occupancyStatus: request.occupancyStatus || '',
        createdAt: request.createdAt || null
      })
    }
  })
  return map
}

function buildDecisionItem(note, property, trustBadge, applicationStatus = null) {
  const cleanNote = noteObject(note)
  return {
    note: cleanNote,
    property,
    trustBadge,
    designRoomsAvailable: Boolean(trustBadge?.hasDesignRoomsLayout),
    applicationStatus: applicationStatus || { status: 'not_applied', actionType: '', occupancyStatus: '' }
  }
}

export async function getDecisionNotes(req, res) {
  try {
    const notes = await DecisionNote.find({ userId: req.user.userId })
      .sort({ updatedAt: -1 })
      .populate({
        path: 'propertyId',
        match: { status: { $ne: 'deleted' } },
        populate: { path: 'manager', select: 'name email role companyName verified isVerified verificationStatus' }
      })
      .lean()

    const validNotes = notes.filter((note) => note.propertyId)
    const propertyIds = validNotes.map((note) => note.propertyId._id)
    const designRoomSet = await getDefaultDesignRoomSet(propertyIds)
    const applicationStatusMap = await getApplicationStatusMap(req.user.userId, propertyIds)

    const items = validNotes.map((note) => {
      const property = note.propertyId
      const id = propertyIdString(property)
      return buildDecisionItem(
        { ...note, propertyId: property._id },
        property,
        calculateListingTrust(property, { hasDefaultDesignRooms: designRoomSet.has(id) }),
        applicationStatusMap.get(id)
      )
    })

    res.status(200).json({
      success: true,
      items,
      notes: items.map((item) => item.note)
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load Decision Hub notes.' })
  }
}

export async function getDecisionNoteByProperty(req, res) {
  try {
    const { propertyId } = req.params
    const access = await getAccessibleProperty(propertyId, req)

    if (access.error) {
      return res.status(access.error.status).json({ message: access.error.message })
    }

    const note = await DecisionNote.findOne({ userId: req.user.userId, propertyId }).lean()
    const defaultDesignRooms = await getDefaultDesignRoomSet([propertyId])
    const trustBadge = calculateListingTrust(access.property, { hasDefaultDesignRooms: defaultDesignRooms.has(propertyId) })

    res.status(200).json({
      success: true,
      note: note || makeDefaultNote(req.user.userId, propertyId),
      property: access.property,
      trustBadge
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load the decision note.' })
  }
}

export async function upsertDecisionNote(req, res) {
  try {
    const { propertyId } = req.params
    const access = await getAccessibleProperty(propertyId, req)

    if (access.error) {
      return res.status(access.error.status).json({ message: access.error.message })
    }

    const payload = cleanPayload(req.body)
    const existing = await DecisionNote.findOne({ userId: req.user.userId, propertyId }).lean()
    const wantsCompare = payload.compareSelected || existing?.compareSelected

    if (wantsCompare) {
      const otherSelectedCount = await DecisionNote.countDocuments({
        userId: req.user.userId,
        compareSelected: true,
        propertyId: { $ne: propertyId }
      })

      if (otherSelectedCount >= 4) {
        return res.status(400).json({ message: 'You can compare up to 4 properties at a time.' })
      }
    }

    if (payload.visitStatus === 'final_choice' || payload.decisionTags.includes('final_choice')) {
      await DecisionNote.updateMany(
        { userId: req.user.userId, propertyId: { $ne: propertyId } },
        { $pull: { decisionTags: 'final_choice' } }
      )
      await DecisionNote.updateMany(
        { userId: req.user.userId, propertyId: { $ne: propertyId }, visitStatus: 'final_choice' },
        { $set: { visitStatus: 'shortlisted' } }
      )
    }

    const note = await DecisionNote.findOneAndUpdate(
      { userId: req.user.userId, propertyId },
      {
        $set: {
          ...payload,
          userId: req.user.userId,
          propertyId
        }
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean()

    res.status(200).json({
      success: true,
      message: 'Decision note saved.',
      note
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to save the decision note.' })
  }
}

export async function toggleCompareSelection(req, res) {
  try {
    const { propertyId } = req.params
    const compareSelected = Boolean(req.body?.compareSelected)
    const access = await getAccessibleProperty(propertyId, req)

    if (access.error) {
      return res.status(access.error.status).json({ message: access.error.message })
    }

    const existing = await DecisionNote.findOne({ userId: req.user.userId, propertyId }).lean()

    if (compareSelected && !existing?.compareSelected) {
      const selectedCount = await DecisionNote.countDocuments({
        userId: req.user.userId,
        compareSelected: true
      })

      if (selectedCount >= 4) {
        return res.status(400).json({ message: 'You can compare up to 4 properties at a time.' })
      }
    }

    const baseNote = existing || makeDefaultNote(req.user.userId, propertyId)

    const note = await DecisionNote.findOneAndUpdate(
      { userId: req.user.userId, propertyId },
      {
        $set: {
          userId: req.user.userId,
          propertyId,
          visitStatus: baseNote.visitStatus || 'not_visited',
          personalRating: baseNote.personalRating || null,
          pros: baseNote.pros || '',
          cons: baseNote.cons || '',
          questionsForManager: baseNote.questionsForManager || '',
          privateNotes: baseNote.privateNotes || '',
          checklist: baseNote.checklist?.length ? baseNote.checklist : defaultChecklist(),
          decisionTags: Array.isArray(baseNote.decisionTags) ? baseNote.decisionTags : [],
          compareSelected
        }
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean()

    res.status(200).json({
      success: true,
      message: compareSelected ? 'Property added to comparison.' : 'Property removed from comparison.',
      note
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update comparison selection.' })
  }
}

export async function getComparisonBoard(req, res) {
  try {
    const notes = await DecisionNote.find({
      userId: req.user.userId,
      compareSelected: true
    })
      .sort({ updatedAt: -1 })
      .limit(4)
      .populate({
        path: 'propertyId',
        match: { status: { $ne: 'deleted' } },
        populate: { path: 'manager', select: 'name email role companyName verified isVerified verificationStatus' }
      })
      .lean()

    const validNotes = notes.filter((note) => note.propertyId)
    const propertyIds = validNotes.map((note) => note.propertyId._id)
    const designRoomSet = await getDefaultDesignRoomSet(propertyIds)
    const applicationStatusMap = await getApplicationStatusMap(req.user.userId, propertyIds)

    const items = validNotes.map((note) => {
      const property = note.propertyId
      const id = propertyIdString(property)
      return buildDecisionItem(
        { ...note, propertyId: property._id },
        property,
        calculateListingTrust(property, { hasDefaultDesignRooms: designRoomSet.has(id) }),
        applicationStatusMap.get(id)
      )
    })

    res.status(200).json({
      success: true,
      items
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load the comparison board.' })
  }
}

export async function getTrustBadge(req, res) {
  try {
    const { propertyId } = req.params
    const access = await getAccessibleProperty(propertyId, req, { allowManagerDraft: true })

    if (access.error) {
      return res.status(access.error.status).json({ message: access.error.message })
    }

    const defaultDesignRooms = await getDefaultDesignRoomSet([propertyId])
    const trustBadge = calculateListingTrust(access.property, { hasDefaultDesignRooms: defaultDesignRooms.has(propertyId) })

    res.status(200).json({
      success: true,
      ...trustBadge
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to calculate listing trust badge.' })
  }
}
