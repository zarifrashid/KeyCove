import Property from '../models/Property.js'
import PropertyRequest from '../models/PropertyRequest.js'
import TenantPropertyRecord from '../models/TenantPropertyRecord.js'
import ManagerDecision from '../models/ManagerDecision.js'

function normalizeString(value, fallback = '') {
  if (value === null || value === undefined) return fallback
  return String(value).trim()
}

function parseOptionalNumber(value, fallback = null) {
  if (value === '' || value === null || value === undefined) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function resolveMonthlyRent(property) {
  const rentPrice = parseOptionalNumber(property?.rentPrice)
  if (rentPrice && rentPrice > 0) return rentPrice

  const legacyPrice = parseOptionalNumber(property?.price)
  if (legacyPrice && legacyPrice > 0) return legacyPrice

  return null
}

function resolveSalePrice(property) {
  const salePrice = parseOptionalNumber(property?.salePrice)
  if (salePrice && salePrice > 0) return salePrice

  const legacyPrice = parseOptionalNumber(property?.price)
  if (legacyPrice && legacyPrice > 0) return legacyPrice

  return null
}

function mapRequest(request) {
  return {
    _id: request._id,
    actionType: request.actionType,
    status: request.status,
    occupancyStatus: request.occupancyStatus || null,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    reviewedAt: request.reviewedAt || null,
    occupancyUpdatedAt: request.occupancyUpdatedAt || null,
    statusHistory: Array.isArray(request.statusHistory) ? request.statusHistory : [],
    tenantSnapshot: request.tenantSnapshot || {},
    pricing: request.pricing || {},
    note: request.note || '',
    property: request.property,
    tenant: request.tenant,
    manager: request.manager
  }
}

async function populateRequestById(requestId) {
  return PropertyRequest.findById(requestId)
    .populate('property', 'title image location listingType price salePrice rentPrice propertyType bedrooms bathrooms squareFeet')
    .populate('tenant', 'name email role createdAt updatedAt')
    .populate('manager', 'name email role')
    .lean()
}

async function safeUpsertManagerDecision(request) {
  try {
    if (!['approved', 'rejected'].includes(request.status) || !request.reviewedAt) return

    await ManagerDecision.findOneAndUpdate(
      { request: request._id },
      {
        request: request._id,
        property: request.property,
        tenant: request.tenant,
        manager: request.manager,
        actionType: request.actionType,
        decision: request.status,
        decidedAt: request.reviewedAt
      },
      {
        upsert: true,
        new: true,
        runValidators: false,
        setDefaultsOnInsert: true
      }
    )
  } catch (_) {
    // Intentionally ignored so approve/reject never fails because of decision-history sync
  }
}

async function safeUpsertTenantPropertyRecord(request) {
  try {
    if (request.status !== 'approved' || !request.reviewedAt) return

    await TenantPropertyRecord.findOneAndUpdate(
      { sourceRequest: request._id },
      {
        property: request.property,
        tenant: request.tenant,
        manager: request.manager,
        sourceRequest: request._id,
        actionType: request.actionType,
        occupancyStatus: request.occupancyStatus || 'active',
        leaseMonths: request.pricing?.leaseMonths ?? null,
        pricing: {
          monthlyRent: request.pricing?.monthlyRent ?? null,
          salePrice: request.pricing?.salePrice ?? null,
          totalCost: request.pricing?.totalCost ?? null
        },
        approvedAt: request.reviewedAt,
        occupancyUpdatedAt: request.occupancyUpdatedAt || request.reviewedAt
      },
      {
        upsert: true,
        new: true,
        runValidators: false,
        setDefaultsOnInsert: true
      }
    )
  } catch (_) {
    // Intentionally ignored so approve never fails because of tracking sync
  }
}

async function safeSyncOccupancyRecord(request) {
  try {
    if (request.status !== 'approved') return

    await TenantPropertyRecord.findOneAndUpdate(
      { sourceRequest: request._id },
      {
        property: request.property,
        tenant: request.tenant,
        manager: request.manager,
        sourceRequest: request._id,
        actionType: request.actionType,
        occupancyStatus: request.occupancyStatus || 'active',
        leaseMonths: request.pricing?.leaseMonths ?? null,
        pricing: {
          monthlyRent: request.pricing?.monthlyRent ?? null,
          salePrice: request.pricing?.salePrice ?? null,
          totalCost: request.pricing?.totalCost ?? null
        },
        approvedAt: request.reviewedAt,
        occupancyUpdatedAt: request.occupancyUpdatedAt || new Date()
      },
      {
        upsert: true,
        new: true,
        runValidators: false,
        setDefaultsOnInsert: true
      }
    )
  } catch (_) {
    // Intentionally ignored so tenant status toggle never fails because of sync
  }
}

export async function getPropertyRequestPrefill(req, res) {
  try {
    if (req.user.role !== 'tenant') {
      return res.status(403).json({ message: 'Only tenants can access request prefill data.' })
    }

    const propertyId = req.params.propertyId || req.query.propertyId || req.body?.propertyId

    if (!propertyId) {
      return res.status(400).json({ message: 'Property ID is required.' })
    }

    const property = await Property.findById(propertyId)
      .populate('manager', 'name email role')
      .lean()

    if (!property || property.status === 'deleted') {
      return res.status(404).json({ message: 'Property not found.' })
    }

    const latestRequest = await PropertyRequest.findOne({ tenant: req.user.userId })
      .sort({ createdAt: -1 })
      .lean()

    const latestSnapshot = latestRequest?.tenantSnapshot || {}

    res.status(200).json({
      success: true,
      prefill: {
        name: normalizeString(req.user.name, latestSnapshot.name || ''),
        email: normalizeString(req.user.email, latestSnapshot.email || ''),
        phone: normalizeString(latestSnapshot.phone),
        occupation: normalizeString(latestSnapshot.occupation),
        monthlyIncome: parseOptionalNumber(latestSnapshot.monthlyIncome),
        employmentStatus: normalizeString(latestSnapshot.employmentStatus),
        employerName: normalizeString(latestSnapshot.employerName),
        currentAddress: normalizeString(latestSnapshot.currentAddress),
        additionalInfo: normalizeString(latestSnapshot.additionalInfo)
      },
      property: {
        _id: property._id,
        title: property.title,
        listingType: property.listingType,
        location: property.location,
        manager: property.manager,
        pricing: {
          monthlyRent: resolveMonthlyRent(property),
          salePrice: resolveSalePrice(property)
        }
      }
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load request prefill data.' })
  }
}

export async function createPropertyRequest(req, res) {
  try {
    if (req.user.role !== 'tenant') {
      return res.status(403).json({ message: 'Only tenants can submit property requests.' })
    }

    const {
      propertyId,
      actionType,
      leaseMonths,
      note,
      phone,
      occupation,
      monthlyIncome,
      employmentStatus,
      employerName,
      currentAddress,
      additionalInfo
    } = req.body || {}

    if (!propertyId) {
      return res.status(400).json({ message: 'Property is required.' })
    }

    if (!['rent', 'lease', 'buy'].includes(actionType)) {
      return res.status(400).json({ message: 'Please choose rent, lease, or buy.' })
    }

    const property = await Property.findById(propertyId).populate('manager', 'name email role')

    if (!property || property.status !== 'active') {
      return res.status(404).json({ message: 'Property not found.' })
    }

    if (!property.manager?._id) {
      return res.status(400).json({ message: 'This property has no assigned manager.' })
    }

    if (property.manager._id.toString() === req.user.userId) {
      return res.status(400).json({ message: 'Managers cannot submit requests to their own property.' })
    }

    const monthlyRent = resolveMonthlyRent(property)
    const salePrice = resolveSalePrice(property)

    if ((actionType === 'rent' || actionType === 'lease') && !monthlyRent) {
      return res.status(400).json({ message: 'This property is not available for rent or lease right now.' })
    }

    if (actionType === 'buy' && !salePrice) {
      return res.status(400).json({ message: 'This property is not available for purchase right now.' })
    }

    const existingPending = await PropertyRequest.findOne({
      property: property._id,
      tenant: req.user.userId,
      actionType,
      status: 'pending'
    })

    if (existingPending) {
      return res.status(400).json({ message: `You already have a pending ${actionType} request for this property.` })
    }

    const normalizedLeaseMonths = actionType === 'lease' ? parseOptionalNumber(leaseMonths) : null

    if (actionType === 'lease' && (!normalizedLeaseMonths || normalizedLeaseMonths <= 0)) {
      return res.status(400).json({ message: 'Lease months must be greater than 0.' })
    }

    const totalCost =
      actionType === 'lease'
        ? monthlyRent * normalizedLeaseMonths
        : actionType === 'buy'
          ? salePrice
          : monthlyRent

    const createdAt = new Date()

    const request = await PropertyRequest.create({
      property: property._id,
      tenant: req.user.userId,
      manager: property.manager._id,
      actionType,
      tenantSnapshot: {
        name: req.user.name,
        email: req.user.email,
        phone: normalizeString(phone),
        occupation: normalizeString(occupation),
        monthlyIncome: parseOptionalNumber(monthlyIncome),
        employmentStatus: normalizeString(employmentStatus),
        employerName: normalizeString(employerName),
        currentAddress: normalizeString(currentAddress),
        additionalInfo: normalizeString(additionalInfo)
      },
      pricing: {
        monthlyRent,
        salePrice,
        leaseMonths: normalizedLeaseMonths,
        totalCost
      },
      note: normalizeString(note),
      statusHistory: [
        {
          status: 'pending',
          changedAt: createdAt,
          changedBy: req.user.userId
        }
      ]
    })

    const populatedRequest = await populateRequestById(request._id)

    res.status(201).json({
      success: true,
      message: 'Request sent to the manager successfully.',
      request: mapRequest(populatedRequest)
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to submit the property request.' })
  }
}

export async function getMyTenantRequests(req, res) {
  try {
    const requests = await PropertyRequest.find({ tenant: req.user.userId })
      .populate('property', 'title image location listingType price salePrice rentPrice propertyType bedrooms bathrooms squareFeet')
      .populate('manager', 'name email role')
      .sort({ createdAt: -1 })
      .lean()

    res.status(200).json({
      success: true,
      requests: requests.map(mapRequest)
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load your requests.' })
  }
}

export async function getManagerRequests(req, res) {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Only managers can review property requests.' })
    }

    const requests = await PropertyRequest.find({ manager: req.user.userId })
      .populate('property', 'title image location listingType price salePrice rentPrice propertyType bedrooms bathrooms squareFeet')
      .populate('tenant', 'name email role createdAt updatedAt')
      .sort({ createdAt: -1 })
      .lean()

    res.status(200).json({
      success: true,
      requests: requests.map(mapRequest)
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load manager requests.' })
  }
}

export async function updatePropertyRequestStatus(req, res) {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Only managers can review property requests.' })
    }

    const { status } = req.body || {}

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected.' })
    }

    const request = await PropertyRequest.findById(req.params.id)

    if (!request) {
      return res.status(404).json({ message: 'Request not found.' })
    }

    if (request.manager.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You can only review requests for your own properties.' })
    }

    const now = new Date()

    request.status = status
    request.reviewedAt = now
    request.reviewedBy = req.user.userId
    request.occupancyStatus = status === 'approved' ? 'active' : null
    request.occupancyUpdatedAt = status === 'approved' ? now : null
    request.statusHistory = [
      ...(Array.isArray(request.statusHistory) ? request.statusHistory : []),
      {
        status,
        changedAt: now,
        changedBy: req.user.userId
      }
    ]

    await request.save()

    await safeUpsertManagerDecision(request)
    await safeUpsertTenantPropertyRecord(request)

    const populatedRequest = await populateRequestById(request._id)

    return res.status(200).json({
      success: true,
      message: status === 'approved' ? 'Request approved successfully.' : 'Request rejected successfully.',
      request: mapRequest(populatedRequest)
    })
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update the request status.' })
  }
}

export async function getApprovedTenantProperties(req, res) {
  try {
    if (req.user.role !== 'tenant') {
      return res.status(403).json({ message: 'Only tenants can view property status tracking.' })
    }

    const requests = await PropertyRequest.find({
      tenant: req.user.userId,
      status: 'approved'
    })
      .populate('property', 'title image location listingType price salePrice rentPrice propertyType bedrooms bathrooms squareFeet')
      .populate('manager', 'name email role')
      .sort({ reviewedAt: -1, createdAt: -1 })
      .lean()

    res.status(200).json({
      success: true,
      properties: requests.map(mapRequest)
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load your approved properties.' })
  }
}

export async function updateTenantOccupancyStatus(req, res) {
  try {
    if (req.user.role !== 'tenant') {
      return res.status(403).json({ message: 'Only tenants can update property status tracking.' })
    }

    const { occupancyStatus } = req.body || {}

    if (!['active', 'previous'].includes(occupancyStatus)) {
      return res.status(400).json({ message: 'Occupancy status must be active or previous.' })
    }

    const request = await PropertyRequest.findById(req.params.id)

    if (!request) {
      return res.status(404).json({ message: 'Approved property record not found.' })
    }

    if (request.tenant.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You can only update your own property status.' })
    }

    if (request.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved applications can be tracked here.' })
    }

    request.occupancyStatus = occupancyStatus
    request.occupancyUpdatedAt = new Date()

    await request.save()
    await safeSyncOccupancyRecord(request)

    const populatedRequest = await populateRequestById(request._id)

    res.status(200).json({
      success: true,
      message: `Property marked as ${occupancyStatus}.`,
      propertyRecord: mapRequest(populatedRequest)
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update property status.' })
  }
}