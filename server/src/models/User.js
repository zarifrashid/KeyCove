import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['tenant', 'manager', 'admin'],
      default: 'tenant'
    },
    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'deleted'],
      default: 'active',
      index: true
    },
    isManagerVerified: {
      type: Boolean,
      default: false
    },
    managerVerificationStatus: {
      type: String,
      enum: ['not_submitted', 'pending', 'verified', 'rejected'],
      default: 'not_submitted'
    },
    suspendedAt: {
      type: Date,
      default: null
    },
    suspendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    suspensionReason: {
      type: String,
      default: '',
      trim: true
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    phone: {
      type: String,
      default: '',
      trim: true
    },
    companyName: {
      type: String,
      default: '',
      trim: true
    },
    adminProfile: {
      accessLevel: { type: Number, default: 1 },
      department: { type: String, default: '', trim: true }
    },
    applicationProfile: {
      phone: { type: String, default: '', trim: true },
      occupation: { type: String, default: '', trim: true },
      monthlyIncome: { type: Number, default: null },
      employmentStatus: { type: String, default: '', trim: true },
      employerName: { type: String, default: '', trim: true },
      currentAddress: { type: String, default: '', trim: true },
      additionalInfo: { type: String, default: '', trim: true },
      lastUpdatedAt: { type: Date, default: null }
    }
  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)
