import Lease from '../models/Lease.js'
import Property from '../models/Property.js'
import PropertyRequest from '../models/PropertyRequest.js'
import User from '../models/User.js'

function normalizeString(value, fallback = '') {
  if (value === null || value === undefined) return fallback
  return String(value).trim()
}

function parseOptionalNumber(value, fallback = null) {
  if (value === '' || value === null || value === undefined) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseRequiredDate(value, fieldLabel) {
  const parsed = new Date(value)
  if (!value || Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldLabel} is required and must be a valid date.`)
  }
  return parsed
}

function populateLeaseQuery(query) {
  return query
    .populate('property', 'title image location squareFeet bedrooms bathrooms propertyType listingType manager')
    .populate('tenant', 'name email role phone companyName applicationProfile')
    .populate('manager', 'name email role phone companyName applicationProfile')
    .populate('sourceRequest', 'actionType status tenantSnapshot pricing note createdAt reviewedAt')
}

function buildTenantInfo(lease) {
  const snapshot = lease?.sourceRequest?.tenantSnapshot || {}
  const profile = lease?.tenant?.applicationProfile || {}

  return {
    fullName: normalizeString(snapshot.name || lease?.tenant?.name),
    email: normalizeString(snapshot.email || lease?.tenant?.email),
    phone: normalizeString(snapshot.phone || lease?.tenant?.phone || profile.phone),
    occupation: normalizeString(snapshot.occupation || profile.occupation),
    employmentStatus: normalizeString(snapshot.employmentStatus || profile.employmentStatus),
    monthlyIncome: parseOptionalNumber(snapshot.monthlyIncome ?? profile.monthlyIncome),
    employerName: normalizeString(snapshot.employerName || profile.employerName),
    currentAddress: normalizeString(snapshot.currentAddress || profile.currentAddress),
    additionalInfo: normalizeString(snapshot.additionalInfo || profile.additionalInfo)
  }
}

function buildManagerInfo(lease) {
  const profile = lease?.manager?.applicationProfile || {}

  return {
    fullName: normalizeString(lease?.manager?.name),
    email: normalizeString(lease?.manager?.email),
    phone: normalizeString(lease?.manager?.phone || profile.phone),
    role: normalizeString(lease?.manager?.role),
    companyName: normalizeString(lease?.manager?.companyName),
    currentAddress: normalizeString(profile.currentAddress),
    additionalInfo: normalizeString(profile.additionalInfo)
  }
}

function mapLease(lease) {
  if (!lease) return null

  return {
    _id: lease._id,
    startDate: lease.startDate,
    endDate: lease.endDate,
    monthlyRent: lease.monthlyRent,
    status: lease.status,
    notes: lease.notes || '',
    createdAt: lease.createdAt,
    updatedAt: lease.updatedAt,
    sourceRequest: lease.sourceRequest
      ? {
          _id: lease.sourceRequest._id,
          actionType: lease.sourceRequest.actionType,
          status: lease.sourceRequest.status,
          createdAt: lease.sourceRequest.createdAt,
          reviewedAt: lease.sourceRequest.reviewedAt,
          note: lease.sourceRequest.note || '',
          pricing: lease.sourceRequest.pricing || {}
        }
      : null,
    property: lease.property
      ? {
          _id: lease.property._id,
          title: lease.property.title,
          image: lease.property.image,
          location: lease.property.location,
          squareFeet: lease.property.squareFeet,
          bedrooms: lease.property.bedrooms,
          bathrooms: lease.property.bathrooms,
          propertyType: lease.property.propertyType,
          listingType: lease.property.listingType
        }
      : null,
    tenant: buildTenantInfo(lease),
    manager: buildManagerInfo(lease)
  }
}

async function findOpenLeaseForProperty(propertyId, excludeLeaseId = null) {
  const query = {
    property: propertyId,
    status: { $in: ['pending', 'active'] }
  }

  if (excludeLeaseId) {
    query._id = { $ne: excludeLeaseId }
  }

  return Lease.findOne(query).lean()
}

function ensureLeaseAccess(lease, requester) {
  if (!lease || !requester) return false

  if (requester.role === 'manager') {
    return lease.manager?._id?.toString?.() === requester.userId || lease.manager?.toString?.() === requester.userId
  }

  if (requester.role === 'tenant') {
    return lease.tenant?._id?.toString?.() === requester.userId || lease.tenant?.toString?.() === requester.userId
  }

  return false
}

async function createLeaseDocument({
  managerId,
  propertyId,
  tenantId,
  sourceRequestId = null,
  startDate,
  endDate,
  monthlyRent,
  status,
  notes
}) {
  const property = await Property.findById(propertyId).lean()

  if (!property || property.status === 'deleted') {
    throw new Error('Property not found.')
  }

  if (property.manager?.toString() !== managerId) {
    const error = new Error('You can only create leases for your own properties.')
    error.statusCode = 403
    throw error
  }

  const propertySupportsLease = property.listingType === 'rent' || Number(property.rentPrice || property.price || 0) > 0
  if (!propertySupportsLease) {
    throw new Error('Leases can only be created for rental or lease properties.')
  }

  const tenant = await User.findById(tenantId).lean()
  if (!tenant) {
    throw new Error('Tenant not found.')
  }

  const openLease = await findOpenLeaseForProperty(property._id)
  if (openLease) {
    const error = new Error('This property already has an active or pending lease.')
    error.statusCode = 409
    throw error
  }

  const parsedStartDate = parseRequiredDate(startDate, 'Lease start date')
  const parsedEndDate = parseRequiredDate(endDate, 'Lease end date')
  const parsedMonthlyRent = parseOptionalNumber(monthlyRent)

  if (parsedMonthlyRent === null || parsedMonthlyRent < 0) {
    throw new Error('Monthly rent is required.')
  }

  const lease = await Lease.create({
    manager: managerId,
    property: property._id,
    tenant: tenant._id,
    sourceRequest: sourceRequestId,
    startDate: parsedStartDate,
    endDate: parsedEndDate,
    monthlyRent: parsedMonthlyRent,
    status: ['pending', 'active', 'expired', 'terminated'].includes(status) ? status : 'active',
    notes: normalizeString(notes)
  })

  return populateLeaseQuery(Lease.findById(lease._id)).lean()
}

export async function getMyLeases(req, res) {
  try {
    const { status } = req.query || {}
    const query = { tenant: req.user.userId }

    if (['pending', 'active', 'expired', 'terminated'].includes(status)) {
      query.status = status
    }

    const leases = await populateLeaseQuery(
      Lease.find(query).sort({ createdAt: -1, startDate: -1 })
    ).lean()

    res.status(200).json({
      success: true,
      leases: leases.map(mapLease)
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load your leases.' })
  }
}

export async function getManagerLeases(req, res) {
  try {
    const { status } = req.query || {}
    const query = { manager: req.user.userId }

    if (['pending', 'active', 'expired', 'terminated'].includes(status)) {
      query.status = status
    }

    const leases = await populateLeaseQuery(
      Lease.find(query).sort({ createdAt: -1, startDate: -1 })
    ).lean()

    res.status(200).json({
      success: true,
      leases: leases.map(mapLease)
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to load manager leases.' })
  }
}

export async function getLeaseById(req, res) {
  try {
    const lease = await populateLeaseQuery(Lease.findById(req.params.id)).lean()

    if (!lease) {
      return res.status(404).json({ message: 'Lease not found.' })
    }

    if (!ensureLeaseAccess(lease, req.user)) {
      return res.status(403).json({ message: 'You are not authorized to view this lease.' })
    }

    return res.status(200).json({
      success: true,
      lease: mapLease(lease)
    })
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to load lease details.' })
  }
}

export async function createLease(req, res) {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Only managers can create leases.' })
    }

    const {
      propertyId,
      tenantId,
      sourceRequest,
      startDate,
      endDate,
      monthlyRent,
      status,
      notes
    } = req.body || {}

    if (!propertyId) {
      return res.status(400).json({ message: 'Property is required.' })
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant is required.' })
    }

    if (sourceRequest) {
      const requestDoc = await PropertyRequest.findById(sourceRequest).lean()
      if (!requestDoc) {
        return res.status(404).json({ message: 'Source request not found.' })
      }

      if (requestDoc.manager?.toString() !== req.user.userId) {
        return res.status(403).json({ message: 'You can only use requests for your own properties.' })
      }

      if (requestDoc.actionType === 'buy') {
        return res.status(400).json({ message: 'Buy requests cannot be converted into leases.' })
      }
    }

    const lease = await createLeaseDocument({
      managerId: req.user.userId,
      propertyId,
      tenantId,
      sourceRequestId: sourceRequest || null,
      startDate,
      endDate,
      monthlyRent,
      status,
      notes
    })

    return res.status(201).json({
      success: true,
      message: 'Lease created successfully.',
      lease: mapLease(lease)
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Failed to create lease.'
    })
  }
}

export async function createLeaseFromRequest(req, res) {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Only managers can create leases from requests.' })
    }

    const requestDoc = await PropertyRequest.findById(req.params.requestId).lean()

    if (!requestDoc) {
      return res.status(404).json({ message: 'Approved request not found.' })
    }

    if (requestDoc.manager?.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You can only create leases for your own approved requests.' })
    }

    if (requestDoc.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved requests can be converted into leases.' })
    }

    if (!['rent', 'lease'].includes(requestDoc.actionType)) {
      return res.status(400).json({ message: 'Buy requests cannot create leases.' })
    }

    const existingSourceLease = await Lease.findOne({ sourceRequest: requestDoc._id }).lean()
    if (existingSourceLease) {
      return res.status(409).json({ message: 'A lease already exists for this approved request.' })
    }

    const openLease = await findOpenLeaseForProperty(requestDoc.property)
    if (openLease) {
      return res.status(409).json({ message: 'This property already has an active or pending lease.' })
    }

    const body = req.body || {}
    const lease = await createLeaseDocument({
      managerId: req.user.userId,
      propertyId: requestDoc.property,
      tenantId: requestDoc.tenant,
      sourceRequestId: requestDoc._id,
      startDate: body.startDate,
      endDate: body.endDate,
      monthlyRent: body.monthlyRent ?? requestDoc.pricing?.monthlyRent,
      status: body.status,
      notes: body.notes || requestDoc.note || ''
    })

    return res.status(201).json({
      success: true,
      message: 'Lease created from approved request successfully.',
      lease: mapLease(lease)
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Failed to create lease from request.'
    })
  }
}

export async function updateLeaseStatus(req, res) {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Only managers can update lease status.' })
    }

    const { status } = req.body || {}

    if (!['pending', 'active', 'expired', 'terminated'].includes(status)) {
      return res.status(400).json({ message: 'Lease status must be pending, active, expired, or terminated.' })
    }

    const lease = await Lease.findById(req.params.id)
    if (!lease) {
      return res.status(404).json({ message: 'Lease not found.' })
    }

    if (lease.manager.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You can only update leases for your own properties.' })
    }

    if (status === 'active') {
      const openLease = await findOpenLeaseForProperty(lease.property, lease._id)
      if (openLease) {
        return res.status(409).json({ message: 'Another active or pending lease already exists for this property.' })
      }
    }

    lease.status = status
    await lease.save()

    const populatedLease = await populateLeaseQuery(Lease.findById(lease._id)).lean()

    return res.status(200).json({
      success: true,
      message: `Lease status updated to ${status}.`,
      lease: mapLease(populatedLease)
    })
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update lease status.' })
  }
}
