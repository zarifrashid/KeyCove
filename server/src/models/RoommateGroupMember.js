import mongoose from 'mongoose'

const tenantSnapshotSchema = new mongoose.Schema(
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

const roommateGroupMemberSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoommateGroup',
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    memberType: {
      type: String,
      enum: ['creator', 'known_registered', 'known_manual', 'unknown_approved'],
      required: true
    },
    status: {
      type: String,
      enum: ['accepted', 'pending_invitation', 'declined', 'left', 'removed'],
      default: 'accepted',
      index: true
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    invitationToken: {
      type: String,
      default: '',
      trim: true
    },
    tenantSnapshot: {
      type: tenantSnapshotSchema,
      default: () => ({})
    },
    relationshipToCreator: {
      type: String,
      default: '',
      trim: true
    },
    expectedContribution: {
      type: Number,
      default: null
    },
    joinedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
)

roommateGroupMemberSchema.index(
  { group: 1, user: 1 },
  { unique: true, partialFilterExpression: { user: { $type: 'objectId' } } }
)
roommateGroupMemberSchema.index({ group: 1, status: 1 })

export default mongoose.model('RoommateGroupMember', roommateGroupMemberSchema)
