import mongoose from 'mongoose'

const tenantPropertyRecordSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    sourceRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PropertyRequest',
      required: true,
      index: true
    },
    actionType: {
      type: String,
      enum: ['rent', 'lease', 'buy'],
      required: true
    },
    occupancyStatus: {
      type: String,
      enum: ['active', 'previous'],
      default: 'active'
    },
    leaseMonths: {
      type: Number,
      default: null
    },
    pricing: {
      monthlyRent: { type: Number, default: null },
      salePrice: { type: Number, default: null },
      totalCost: { type: Number, default: null }
    },
    approvedAt: {
      type: Date,
      required: true
    },
    occupancyUpdatedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
)

tenantPropertyRecordSchema.index({ tenant: 1, occupancyStatus: 1, approvedAt: -1 })
tenantPropertyRecordSchema.index({ manager: 1, approvedAt: -1 })
tenantPropertyRecordSchema.index({ tenant: 1, property: 1, actionType: 1 })
tenantPropertyRecordSchema.index({ sourceRequest: 1, tenant: 1 }, { unique: true })

export default mongoose.model('TenantPropertyRecord', tenantPropertyRecordSchema)
