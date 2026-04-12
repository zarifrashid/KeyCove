import mongoose from 'mongoose'

const managerDecisionSchema = new mongoose.Schema(
  {
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PropertyRequest',
      required: true,
      unique: true
    },
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
    actionType: {
      type: String,
      enum: ['rent', 'lease', 'buy'],
      required: true
    },
    decision: {
      type: String,
      enum: ['approved', 'rejected'],
      required: true,
      index: true
    },
    decidedAt: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
)

managerDecisionSchema.index({ manager: 1, decidedAt: -1 })
managerDecisionSchema.index({ tenant: 1, decidedAt: -1 })
managerDecisionSchema.index({ property: 1, decidedAt: -1 })

export default mongoose.model('ManagerDecision', managerDecisionSchema)
