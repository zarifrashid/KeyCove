import Property from '../models/Property.js'
import PropertyRequest from '../models/PropertyRequest.js'
import TenantPropertyRecord from '../models/TenantPropertyRecord.js'
import ManagerDecision from '../models/ManagerDecision.js'
import User from '../models/User.js'
import { buildRequestActionLabel, createNotification } from '../services/notifications/notificationService.js'

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

function buildTenantSnapshot(request, fallbackUser = {}) {
  const snapshot = request?.tenantSnapshot || {}
  const profile = fallbackUser?.applicationProfile || {}

  return {
    name: normalizeString(snapshot.name || fallbackUser?.name),
    email: normalizeString(snapshot.email || fallbackUser?.email),
    phone: normalizeString(snapshot.phone || fallbackUser?.phone || profile.phone),
    occupation: normalizeString(snapshot.occupation || profile.occupation),
    monthlyIncome: parseOptionalNumber(snapshot.monthlyIncome ?? profile.monthlyIncome),
    employmentStatus: normalizeString(snapshot.employmentStatus || profile.employmentStatus),
    employerName: normalizeString(snapshot.employerName || profile.employerName),
    currentAddress: normalizeString(snapshot.currentAddress || profile.currentAddress),
    additionalInfo: normalizeString(snapshot.additionalInfo || profile.additionalInfo)
  }
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
    tenantSnapshot: buildTenantSnapshot(request, request.tenant),
    pricing: request.pricing || {},
    note: request.note || '',
    message: request.note || '',
    property: request.property,
    tenant: request.tenant,
    manager: request.manager
  }
}

async function populateRequestById(requestId) {
  return PropertyRequest.findById(requestId)
    .populate('property', 'title image location listingType price salePrice rentPrice propertyType bedrooms bathrooms squareFeet')
    .populate('tenant', 'name email role phone companyName applicationProfile createdAt updatedAt')
    .populate('manager', 'name email role phone companyName applicationProfile')
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


function getPropertyTitleFromRequest(request) {
  return request?.property?.title || 'this property'
}

function getRequestDetailsActionUrl(requestId) {
  return `/property-requests/${requestId}`
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
    const actionType = req.query.type || req.body?.actionType || 'rent'

    if (!propertyId) {
      return res.status(400).json({ message: 'Property ID is required.' })
    }

    const property = await Property.findById(propertyId)
      .populate('manager', 'name email role phone companyName')
      .lean()

    if (!property || property.status === 'deleted') {
      return res.status(404).json({ message: 'Property not found.' })
    }

    const latestRequest = await PropertyRequest.findOne({ tenant: req.user.userId })
      .sort({ createdAt: -1 })
      .lean()

    const latestSnapshot = latestRequest?.tenantSnapshot || {}
    const profile = req.user.applicationProfile || {}
    const prefillFields = {
      name: normalizeString(req.user.name, latestSnapshot.name || ''),
      email: normalizeString(req.user.email, latestSnapshot.email || ''),
      phone: normalizeString(latestSnapshot.phone || req.user.phone || profile.phone),
      occupation: normalizeString(latestSnapshot.occupation || profile.occupation),
      monthlyIncome: parseOptionalNumber(latestSnapshot.monthlyIncome ?? profile.monthlyIncome),
      employmentStatus: normalizeString(latestSnapshot.employmentStatus || profile.employmentStatus),
      employerName: normalizeString(latestSnapshot.employerName || profile.employerName),
      currentAddress: normalizeString(latestSnapshot.currentAddress || profile.currentAddress),
      additionalInfo: normalizeString(latestSnapshot.additionalInfo || profile.additionalInfo)
    }

    const monthlyRent = resolveMonthlyRent(property)
    const salePrice = resolveSalePrice(property)
    const suggestedLeaseMonths = latestRequest?.actionType === 'lease' && latestRequest?.pricing?.leaseMonths
      ? latestRequest.pricing.leaseMonths
      : 12

    res.status(200).json({
      success: true,
      prefill: {
        ...prefillFields,
        autoFilled: prefillFields,
        suggestions: {
          suggestedLeaseMonths: actionType === 'lease' ? suggestedLeaseMonths : undefined
        },
        pricingPreview: {
          applicationFee: 0,
          serviceFee: 0,
          monthlyRent,
          salePrice
        }
      },
      property: {
        _id: property._id,
        title: property.title,
        listingType: property.listingType,
        location: property.location,
        manager: property.manager,
        pricing: {
          monthlyRent,
          salePrice
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

    const payload = req.body || {}
    const nestedDetails = payload.applicationDetails || {}

    const {
      propertyId,
      actionType,
      leaseMonths
    } = payload

    const noteOrMessage = payload.note ?? payload.message ?? ''
    const phone = payload.phone ?? nestedDetails.phone
    const occupation = payload.occupation ?? nestedDetails.occupation
    const monthlyIncome = payload.monthlyIncome ?? nestedDetails.monthlyIncome
    const employmentStatus = payload.employmentStatus ?? nestedDetails.employmentStatus
    const employerName = payload.employerName ?? payload.employer ?? nestedDetails.employerName ?? nestedDetails.employer
    const currentAddress = payload.currentAddress ?? nestedDetails.currentAddress
    const additionalInfo = payload.additionalInfo ?? nestedDetails.additionalInfo

    if (!propertyId) {
      return res.status(400).json({ message: 'Property is required.' })
    }

    if (!['rent', 'lease', 'buy'].includes(actionType)) {
      return res.status(400).json({ message: 'Please choose rent, lease, or buy.' })
    }

    const property = await Property.findById(propertyId).populate('manager', 'name email role phone companyName')

    if (!property || property.status !== 'active') {
      return res.status(404).json({ message: 'Property not found.' })
    }

    if (!property.manager?._id) {
      return res.status(400).json({ message: 'This property has no assigned manager.' })
    }

    if (property.manager._id.toString() === req.user.userId) {
      return res.status(400).json({ message: 'Managers cannot submit requests to their own property.' })
    }

    const monthlyRentValue = resolveMonthlyRent(property)
    const salePrice = resolveSalePrice(property)

    if ((actionType === 'rent' || actionType === 'lease') && !monthlyRentValue) {
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
        ? monthlyRentValue * normalizedLeaseMonths
        : actionType === 'buy'
          ? salePrice
          : monthlyRentValue

    const createdAt = new Date()
    const normalizedSnapshot = {
      name: normalizeString(req.user.name),
      email: normalizeString(req.user.email),
      phone: normalizeString(phone, req.user.phone || req.user.applicationProfile?.phone || ''),
      occupation: normalizeString(occupation, req.user.applicationProfile?.occupation || ''),
      monthlyIncome: parseOptionalNumber(monthlyIncome, req.user.applicationProfile?.monthlyIncome ?? null),
      employmentStatus: normalizeString(employmentStatus, req.user.applicationProfile?.employmentStatus || ''),
      employerName: normalizeString(employerName, req.user.applicationProfile?.employerName || ''),
      currentAddress: normalizeString(currentAddress, req.user.applicationProfile?.currentAddress || ''),
      additionalInfo: normalizeString(additionalInfo, req.user.applicationProfile?.additionalInfo || '')
    }

    const request = await PropertyRequest.create({
      property: property._id,
      tenant: req.user.userId,
      manager: property.manager._id,
      actionType,
      tenantSnapshot: normalizedSnapshot,
      pricing: {
        monthlyRent: monthlyRentValue,
        salePrice,
        leaseMonths: normalizedLeaseMonths,
        totalCost
      },
      note: normalizeString(noteOrMessage),
      statusHistory: [
        {
          status: 'pending',
          changedAt: createdAt,
          changedBy: req.user.userId
        }
      ]
    })

    await User.findByIdAndUpdate(req.user.userId, {
      $set: {
        phone: normalizedSnapshot.phone,
        'applicationProfile.phone': normalizedSnapshot.phone,
        'applicationProfile.occupation': normalizedSnapshot.occupation,
        'applicationProfile.monthlyIncome': normalizedSnapshot.monthlyIncome,
        'applicationProfile.employmentStatus': normalizedSnapshot.employmentStatus,
        'applicationProfile.employerName': normalizedSnapshot.employerName,
        'applicationProfile.currentAddress': normalizedSnapshot.currentAddress,
        'applicationProfile.additionalInfo': normalizedSnapshot.additionalInfo,
        'applicationProfile.lastUpdatedAt': createdAt
      }
    })

    const populatedRequest = await populateRequestById(request._id)

    await createNotification({
      userId: property.manager._id,
      actorId: req.user.userId,
      title: `New ${actionType} request`,
      body: `${req.user.name || 'A tenant'} sent a ${actionType} request for ${property.title}.`,
      type: 'application',
      relatedEntityType: 'propertyRequest',
      relatedEntityId: request._id,
      actionUrl: getRequestDetailsActionUrl(request._id),
      priority: 'high'
    })

    res.status(201).json({
      success: true,
      message: 'Request sent to the manager successfully.',
      request: mapRequest(populatedRequest)
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to submit the property request.' })
  }
}

export async function getPropertyRequestById(req, res) {
  try {
    const request = await populateRequestById(req.params.id)

    if (!request) {
      return res.status(404).json({ message: 'Property request not found.' })
    }

    const tenantId = request.tenant?._id?.toString?.() || request.tenant?.toString?.()
    const managerId = request.manager?._id?.toString?.() || request.manager?.toString?.()

    const canView =
      req.user.role === 'admin' ||
      tenantId === req.user.userId ||
      managerId === req.user.userId

    if (!canView) {
      return res.status(403).json({ message: 'You cannot view this property request.' })
    }

    res.status(200).json({
      success: true,
      request: mapRequest(request)
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load property request.' })
  }
}

export async function getMyTenantRequests(req, res) {
  try {
    const requests = await PropertyRequest.find({ tenant: req.user.userId })
      .populate('property', 'title image location listingType price salePrice rentPrice propertyType bedrooms bathrooms squareFeet')
      .populate('manager', 'name email role phone companyName applicationProfile')
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
      .populate('tenant', 'name email role phone companyName applicationProfile createdAt updatedAt')
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

    if (request.status === status) {
      const populatedRequest = await populateRequestById(request._id)
      return res.status(200).json({
        success: true,
        message: 'Request status is already up to date.',
        request: mapRequest(populatedRequest)
      })
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
    const actionLabel = buildRequestActionLabel(populatedRequest?.actionType || request.actionType)
    const propertyTitle = getPropertyTitleFromRequest(populatedRequest)

    await createNotification({
      userId: request.tenant,
      actorId: req.user.userId,
      title: `${actionLabel} ${status}`,
      body: `Your ${String(populatedRequest?.actionType || request.actionType)} request for ${propertyTitle} was ${status}.`,
      type: 'application',
      relatedEntityType: 'propertyRequest',
      relatedEntityId: request._id,
      actionUrl: getRequestDetailsActionUrl(request._id),
      priority: status === 'approved' ? 'high' : 'normal'
    })

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
      .populate('manager', 'name email role phone companyName applicationProfile')
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

    if (request.occupancyStatus === occupancyStatus) {
      const populatedRequest = await populateRequestById(request._id)
      return res.status(200).json({
        success: true,
        message: `Property is already marked as ${occupancyStatus}.`,
        propertyRecord: mapRequest(populatedRequest)
      })
    }

    request.occupancyStatus = occupancyStatus
    request.occupancyUpdatedAt = new Date()

    await request.save()
    await safeSyncOccupancyRecord(request)

    const populatedRequest = await populateRequestById(request._id)
    const propertyTitle = getPropertyTitleFromRequest(populatedRequest)

    await createNotification({
      userId: request.manager,
      actorId: req.user.userId,
      title: 'Tenant property status updated',
      body: `${req.user.name || 'A tenant'} marked ${propertyTitle} as ${occupancyStatus}.`,
      type: 'application',
      relatedEntityType: 'propertyRequest',
      relatedEntityId: request._id,
      actionUrl: getRequestDetailsActionUrl(request._id)
    })

    res.status(200).json({
      success: true,
      message: `Property marked as ${occupancyStatus}.`,
      propertyRecord: mapRequest(populatedRequest)
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to update property status.' })
  }
}
