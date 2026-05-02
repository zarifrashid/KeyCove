import mongoose from 'mongoose'

export const PROPERTY_REPORT_REASONS = [
  'fake_listing',
  'wrong_rent',
  'wrong_location',
  'wrong_property_information',
  'misleading_photos',
  'property_already_rented',
  'duplicate_listing',
  'inappropriate_content',
  'suspicious_manager',
  'other'
]

export const PROPERTY_REPORT_STATUSES = ['pending', 'reviewed', 'replied', 'resolved', 'dismissed']

const propertyReportSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    propertyManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    reason: {
      type: String,
      enum: PROPERTY_REPORT_REASONS,
      required: true,
      index: true
    },
    comment: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000
    },
    status: {
      type: String,
      enum: PROPERTY_REPORT_STATUSES,
      default: 'pending',
      index: true
    },
    adminReply: {
      message: { type: String, trim: true, default: '', maxlength: 3000 },
      repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      repliedAt: { type: Date, default: null }
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    dismissedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    dismissedAt: {
      type: Date,
      default: null
    },
    adminInternalNote: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2500
    }
  },
  { timestamps: true }
)

propertyReportSchema.index({ property: 1, reportedBy: 1, reason: 1, status: 1 })
propertyReportSchema.index({ status: 1, createdAt: -1 })
propertyReportSchema.index({ propertyManager: 1, status: 1 })
propertyReportSchema.index({ 'adminReply.repliedAt': -1 })

export default mongoose.model('PropertyReport', propertyReportSchema)
