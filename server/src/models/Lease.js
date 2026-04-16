import mongoose from 'mongoose'

const leaseSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sourceRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PropertyRequest',
      default: null
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    monthlyRent: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'expired', 'terminated'],
      default: 'active'
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { timestamps: true }
)

leaseSchema.pre('validate', function validateLeaseDates(next) {
  if (!this.startDate || !this.endDate) {
    return next()
  }

  const start = new Date(this.startDate)
  const end = new Date(this.endDate)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return next(new Error('Lease start date and end date must be valid dates.'))
  }

  if (end <= start) {
    return next(new Error('Lease end date must be after the start date.'))
  }

  return next()
})

leaseSchema.index({ manager: 1, status: 1, createdAt: -1 })
leaseSchema.index({ tenant: 1, status: 1, createdAt: -1 })
leaseSchema.index({ property: 1, status: 1, createdAt: -1 })
leaseSchema.index({ sourceRequest: 1 }, { unique: true, sparse: true })

export default mongoose.model('Lease', leaseSchema)
