import mongoose from 'mongoose'

const managerVerificationSchema = new mongoose.Schema(
  {
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    companyName: {
      type: String,
      required: true,
      trim: true
    },
    businessEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    businessPhone: {
      type: String,
      trim: true,
      default: ''
    },
    licenseNumber: {
      type: String,
      trim: true,
      default: ''
    },
    businessAddress: {
      type: String,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      trim: true,
      default: ''
    },
    state: {
      type: String,
      trim: true,
      default: ''
    },
    country: {
      type: String,
      trim: true,
      default: ''
    },
    yearsOfExperience: {
      type: Number,
      min: 0,
      default: 0
    },
    documentType: {
      type: String,
      enum: ['nid', 'trade_license', 'company_registration', 'broker_license', 'other'],
      default: 'other'
    },
    documentUrl: {
      type: String,
      required: true,
      trim: true
    },
    verificationMessage: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
      index: true
    },
    adminNote: {
      type: String,
      default: '',
      trim: true
    },
    reviewedByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
)

managerVerificationSchema.index({ manager: 1, status: 1 })
managerVerificationSchema.index({ createdAt: -1 })

export default mongoose.model('ManagerVerification', managerVerificationSchema)
