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
      enum: ['tenant', 'manager'],
      default: 'tenant'
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
