import mongoose from 'mongoose'

const applicantSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    phone: { type: String, default: '', trim: true },
    occupation: { type: String, default: '', trim: true },
    monthlyIncome: { type: Number, default: null },
    employmentStatus: { type: String, default: '', trim: true },
    employerName: { type: String, default: '', trim: true },
    currentAddress: { type: String, default: '', trim: true },
    additionalInfo: { type: String, default: '', trim: true }
  },
  { _id: false }
)

const roommateJoinRequestSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoommateGroup',
      required: true,
      index: true
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'withdrawn', 'cancelled'],
      default: 'pending',
      index: true
    },
    applicantSnapshot: {
      type: applicantSnapshotSchema,
      default: () => ({})
    },
    introMessage: {
      type: String,
      default: '',
      trim: true
    },
    lifestyleNote: {
      type: String,
      default: '',
      trim: true
    },
    expectedContribution: {
      type: Number,
      default: null
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    decidedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
)

roommateJoinRequestSchema.index({ group: 1, applicant: 1 }, { unique: true })
roommateJoinRequestSchema.index({ host: 1, status: 1 })
roommateJoinRequestSchema.index({ applicant: 1, status: 1 })
roommateJoinRequestSchema.index({ property: 1, status: 1 })

export default mongoose.model('RoommateJoinRequest', roommateJoinRequestSchema)
