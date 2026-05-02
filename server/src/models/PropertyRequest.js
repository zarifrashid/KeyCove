import mongoose from 'mongoose'

const propertyRequestSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    actionType: {
      type: String,
      enum: ['rent', 'lease', 'buy'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
        applicationMode: {
      type: String,
      enum: ['solo', 'roommate_group'],
      default: 'solo',
      index: true
    },
    roommateGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoommateGroup',
      default: null,
      index: true
    },
    groupSnapshot: {
      groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'RoommateGroup', default: null },
      targetGroupSize: { type: Number, default: null },
      rentPerPerson: { type: Number, default: null },
      acceptedMembers: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
          memberType: { type: String, default: '' },
          name: { type: String, default: '' },
          email: { type: String, default: '' },
          phone: { type: String, default: '' },
          occupation: { type: String, default: '' },
          employmentStatus: { type: String, default: '' },
          monthlyIncome: { type: Number, default: null },
          expectedContribution: { type: Number, default: null },
          relationshipToCreator: { type: String, default: '' }
        }
      ],
      preferences: {
        preferredGender: { type: String, default: '' },
        preferredOccupation: { type: String, default: '' },
        smokingPreference: { type: String, default: '' },
        petPreference: { type: String, default: '' },
        cleanlinessPreference: { type: String, default: '' },
        lifestylePreference: { type: String, default: '' }
      },
      messageToManager: { type: String, default: '' }
    },
    occupancyStatus: {
      type: String,
      enum: ['active', 'previous', null],
      default: null
    },
    tenantSnapshot: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      occupation: { type: String, default: '' },
      monthlyIncome: { type: Number, default: null },
      employmentStatus: { type: String, default: '' },
      employerName: { type: String, default: '' },
      currentAddress: { type: String, default: '' },
      additionalInfo: { type: String, default: '' }
    },
    pricing: {
      monthlyRent: { type: Number, default: null },
      salePrice: { type: Number, default: null },
      leaseMonths: { type: Number, default: null },
      totalCost: { type: Number, default: null }
    },
    note: {
      type: String,
      trim: true,
      default: ''
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    occupancyUpdatedAt: {
      type: Date,
      default: null
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          required: true
        },
        changedAt: {
          type: Date,
          required: true
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          default: null
        }
      }
    ]
  },
  { timestamps: true }
)

propertyRequestSchema.index({ manager: 1, status: 1, createdAt: -1 })
propertyRequestSchema.index({ tenant: 1, createdAt: -1 })
propertyRequestSchema.index({ tenant: 1, status: 1, occupancyStatus: 1, createdAt: -1 })
propertyRequestSchema.index({ property: 1, createdAt: -1 })
propertyRequestSchema.index({ roommateGroup: 1, applicationMode: 1 })

export default mongoose.model('PropertyRequest', propertyRequestSchema)
