import mongoose from 'mongoose'

const roommateGroupSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    actionType: {
      type: String,
      enum: ['rent', 'lease'],
      required: true,
      index: true
    },
    applicationMode: {
      type: String,
      enum: ['known_roommates', 'unknown_roommate_search'],
      required: true
    },
    targetGroupSize: {
      type: Number,
      required: true,
      min: 2
    },
    acceptedMemberCount: {
      type: Number,
      default: 1,
      min: 0
    },
    remainingSlots: {
      type: Number,
      default: 0,
      min: 0
    },
    leaseMonths: {
      type: Number,
      default: null
    },
    moveInDate: {
      type: Date,
      default: null
    },
    monthlyRent: {
      type: Number,
      default: null
    },
    rentPerPerson: {
      type: Number,
      default: null
    },
    totalCost: {
      type: Number,
      default: null
    },
    status: {
      type: String,
      enum: [
        'open',
        'waiting_for_known_roommates',
        'full',
        'ready_for_manager',
        'sent_to_manager',
        'manager_approved',
        'manager_rejected',
        'cancelled',
        'expired'
      ],
      default: 'open',
      index: true
    },
    preferences: {
      preferredGender: { type: String, default: '', trim: true },
      preferredOccupation: { type: String, default: '', trim: true },
      smokingPreference: { type: String, default: '', trim: true },
      petPreference: { type: String, default: '', trim: true },
      cleanlinessPreference: { type: String, default: '', trim: true },
      lifestylePreference: { type: String, default: '', trim: true }
    },
    introMessage: {
      type: String,
      default: '',
      trim: true
    },
    messageToManager: {
      type: String,
      default: '',
      trim: true
    },
    sourcePropertyRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PropertyRequest',
      default: null,
      index: true
    },
    expiresAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
)

roommateGroupSchema.index({ property: 1, actionType: 1, status: 1 })
roommateGroupSchema.index({ creator: 1, status: 1 })
roommateGroupSchema.index({ manager: 1, status: 1 })

export default mongoose.model('RoommateGroup', roommateGroupSchema)
