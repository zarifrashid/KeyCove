import mongoose from 'mongoose'
import Property from '../models/Property.js'
import PropertyReport, { PROPERTY_REPORT_REASONS, PROPERTY_REPORT_STATUSES } from '../models/PropertyReport.js'
import User from '../models/User.js'
import {
  createNotification,
  createNotificationsForUsers,
  getAdminIds
} from '../services/notifications/notificationService.js'

const REASON_LABELS = {
  fake_listing: 'Fake listing',
  wrong_rent: 'Wrong rent',
  wrong_location: 'Wrong location',
  wrong_property_information: 'Wrong property information',
  misleading_photos: 'Misleading photos',
  property_already_rented: 'Property already rented',
  duplicate_listing: 'Duplicate listing',
  inappropriate_content: 'Inappropriate content',
  suspicious_manager: 'Suspicious manager',
  other: 'Other'
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value)
}

function getReasonLabel(reason) {
  return REASON_LABELS[reason] || 'Property issue'
}

function getPropertyTitle(property) {
  return property?.title || 'this property'
}

function normalizeSearchText(value) {
  return String(value || '').trim()
}

function buildTenantReport(report) {
  if (!report) return null

  return {
    _id: report._id,
    property: report.property ? {
      _id: report.property._id,
      title: report.property.title,
      location: report.property.location,
      price: report.property.price,
      rentPrice: report.property.rentPrice,
      salePrice: report.property.salePrice,
      listingType: report.property.listingType,
      propertyType: report.property.propertyType,
      status: report.property.status,
      image: report.property.image
    } : null,
    reason: report.reason,
    reasonLabel: getReasonLabel(report.reason),
    comment: report.comment || '',
    status: report.status,
    adminReply: {
      message: report.adminReply?.message || '',
      repliedAt: report.adminReply?.repliedAt || null
    },
    createdAt: report.createdAt,
    updatedAt: report.updatedAt
  }
}

async function getPopulatedReport(reportId) {
  return PropertyReport.findById(reportId)
    .populate('property', 'title location price rentPrice salePrice listingType propertyType status image manager')
    .populate('reportedBy', 'name email phone role')
    .populate('propertyManager', 'name email phone companyName role')
    .populate('reviewedBy', 'name email')
    .populate('resolvedBy', 'name email')
    .populate('dismissedBy', 'name email')
    .populate('adminReply.repliedBy', 'name email')
}

export async function createPropertyReport(req, res) {
  try {
    const { propertyId, reason, comment = '' } = req.body || {}

    if (!propertyId || !isValidObjectId(propertyId)) {
      return res.status(400).json({ message: 'Valid property ID is required.' })
    }

    if (!PROPERTY_REPORT_REASONS.includes(reason)) {
      return res.status(400).json({ message: 'Please select a valid report reason.' })
    }

    const property = await Property.findById(propertyId).populate('manager', 'name email role')
    if (!property) {
      return res.status(404).json({ message: 'Property not found.' })
    }

    const duplicate = await PropertyReport.findOne({
      property: property._id,
      reportedBy: req.user.userId,
      reason,
      status: 'pending'
    })

    if (duplicate) {
      return res.status(409).json({ message: 'You already submitted a pending report for this issue.' })
    }

    const report = await PropertyReport.create({
      property: property._id,
      reportedBy: req.user.userId,
      propertyManager: property.manager?._id || property.manager,
      reason,
      comment: String(comment || '').trim()
    })

    const adminIds = await getAdminIds()
    await createNotificationsForUsers(adminIds, {
      actorId: req.user.userId,
      title: 'New Property Report',
      body: `${req.user.name || 'A tenant'} reported ${getPropertyTitle(property)} for ${getReasonLabel(reason)}.`,
      type: 'system',
      relatedEntityType: 'property_report',
      relatedEntityId: report._id,
      actionUrl: `/admin/reports/${report._id}`,
      priority: 'high',
      skipActor: false
    })

    const populatedReport = await getPopulatedReport(report._id)

    return res.status(201).json({
      message: 'Your report has been submitted to the admin team. You will be notified when an admin replies.',
      report: buildTenantReport(populatedReport)
    })
  } catch (error) {
    console.error('Create property report error:', error)
    return res.status(500).json({ message: 'Failed to submit property report.' })
  }
}

export async function getMyPropertyReports(req, res) {
  try {
    const reports = await PropertyReport.find({ reportedBy: req.user.userId })
      .sort({ createdAt: -1 })
      .populate('property', 'title location price rentPrice salePrice listingType propertyType status image')

    return res.json({ reports: reports.map(buildTenantReport) })
  } catch (error) {
    console.error('Get my property reports error:', error)
    return res.status(500).json({ message: 'Failed to load your property reports.' })
  }
}

export async function getMyPropertyReportById(req, res) {
  try {
    const { reportId } = req.params
    if (!isValidObjectId(reportId)) {
      return res.status(400).json({ message: 'Valid report ID is required.' })
    }

    const report = await PropertyReport.findOne({ _id: reportId, reportedBy: req.user.userId })
      .populate('property', 'title location price rentPrice salePrice listingType propertyType status image')

    if (!report) {
      return res.status(404).json({ message: 'Report not found.' })
    }

    return res.json({ report: buildTenantReport(report) })
  } catch (error) {
    console.error('Get tenant property report error:', error)
    return res.status(500).json({ message: 'Failed to load property report.' })
  }
}

export async function getAdminPropertyReports(req, res) {
  try {
    const {
      status = '',
      reason = '',
      search = '',
      page = '1',
      limit = '50',
      sort = '-createdAt'
    } = req.query || {}

    const filter = {}
    if (status && PROPERTY_REPORT_STATUSES.includes(status)) filter.status = status
    if (reason && PROPERTY_REPORT_REASONS.includes(reason)) filter.reason = reason

    const trimmedSearch = normalizeSearchText(search)
    if (trimmedSearch) {
      const regex = new RegExp(trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      const matchingUsers = await User.find({
        $or: [
          { name: regex },
          { email: regex },
          { companyName: regex }
        ]
      }).select('_id')
      const matchingProperties = await Property.find({ title: regex }).select('_id')

      filter.$or = [
        { reason: regex },
        { comment: regex },
        { reportedBy: { $in: matchingUsers.map((user) => user._id) } },
        { propertyManager: { $in: matchingUsers.map((user) => user._id) } },
        { property: { $in: matchingProperties.map((property) => property._id) } }
      ]
    }

    const safePage = Math.max(Number(page) || 1, 1)
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100)
    const skip = (safePage - 1) * safeLimit
    const sortOption = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 }

    const [reports, total] = await Promise.all([
      PropertyReport.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(safeLimit)
        .populate('property', 'title location price rentPrice salePrice listingType propertyType status image manager')
        .populate('reportedBy', 'name email phone role')
        .populate('propertyManager', 'name email phone companyName role')
        .populate('adminReply.repliedBy', 'name email'),
      PropertyReport.countDocuments(filter)
    ])

    return res.json({
      reports,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit)
      }
    })
  } catch (error) {
    console.error('Get admin property reports error:', error)
    return res.status(500).json({ message: 'Failed to load property reports.' })
  }
}

export async function getAdminPropertyReportById(req, res) {
  try {
    const { reportId } = req.params
    if (!isValidObjectId(reportId)) {
      return res.status(400).json({ message: 'Valid report ID is required.' })
    }

    const report = await getPopulatedReport(reportId)
    if (!report) {
      return res.status(404).json({ message: 'Report not found.' })
    }

    return res.json({ report })
  } catch (error) {
    console.error('Get admin property report error:', error)
    return res.status(500).json({ message: 'Failed to load property report.' })
  }
}

export async function replyToPropertyReport(req, res) {
  try {
    const { reportId } = req.params
    const { message = '' } = req.body || {}
    const replyMessage = String(message || '').trim()

    if (!isValidObjectId(reportId)) {
      return res.status(400).json({ message: 'Valid report ID is required.' })
    }

    if (!replyMessage) {
      return res.status(400).json({ message: 'Reply message cannot be empty.' })
    }

    const report = await PropertyReport.findById(reportId).populate('property', 'title')
    if (!report) {
      return res.status(404).json({ message: 'Report not found.' })
    }

    report.adminReply = {
      message: replyMessage,
      repliedBy: req.user.userId,
      repliedAt: new Date()
    }
    report.status = 'replied'
    report.reviewedBy = report.reviewedBy || req.user.userId
    report.reviewedAt = report.reviewedAt || new Date()
    await report.save()

    await createNotification({
      userId: report.reportedBy,
      actorId: req.user.userId,
      title: 'Admin replied to your report',
      body: `An admin replied to your report about ${getPropertyTitle(report.property)}.`,
      type: 'system',
      relatedEntityType: 'property_report',
      relatedEntityId: report._id,
      actionUrl: `/tenant/reports/${report._id}`,
      priority: 'high',
      skipActor: false
    })

    const populatedReport = await getPopulatedReport(report._id)
    return res.json({ message: 'Reply sent to tenant successfully.', report: populatedReport })
  } catch (error) {
    console.error('Reply to property report error:', error)
    return res.status(500).json({ message: 'Failed to send admin reply.' })
  }
}

export async function updatePropertyReportStatus(req, res) {
  try {
    const { reportId } = req.params
    const { status, adminInternalNote = '' } = req.body || {}

    if (!isValidObjectId(reportId)) {
      return res.status(400).json({ message: 'Valid report ID is required.' })
    }

    if (!['reviewed', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Status must be reviewed, resolved, or dismissed.' })
    }

    const report = await PropertyReport.findById(reportId).populate('property', 'title')
    if (!report) {
      return res.status(404).json({ message: 'Report not found.' })
    }

    const now = new Date()
    report.status = status
    report.adminInternalNote = String(adminInternalNote || '').trim()

    if (status === 'reviewed') {
      report.reviewedBy = req.user.userId
      report.reviewedAt = now
    }

    if (status === 'resolved') {
      report.resolvedBy = req.user.userId
      report.resolvedAt = now
    }

    if (status === 'dismissed') {
      report.dismissedBy = req.user.userId
      report.dismissedAt = now
    }

    await report.save()

    if (status === 'resolved' || status === 'dismissed') {
      await createNotification({
        userId: report.reportedBy,
        actorId: req.user.userId,
        title: status === 'resolved' ? 'Your property report was resolved' : 'Your property report was reviewed',
        body: status === 'resolved'
          ? `Your report about ${getPropertyTitle(report.property)} has been marked as resolved.`
          : `Your report about ${getPropertyTitle(report.property)} was reviewed and dismissed.`,
        type: 'system',
        relatedEntityType: 'property_report',
        relatedEntityId: report._id,
        actionUrl: `/tenant/reports/${report._id}`,
        priority: 'normal',
        skipActor: false
      })
    }

    const populatedReport = await getPopulatedReport(report._id)
    return res.json({ message: 'Report status updated successfully.', report: populatedReport })
  } catch (error) {
    console.error('Update property report status error:', error)
    return res.status(500).json({ message: 'Failed to update report status.' })
  }
}
