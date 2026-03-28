import mongoose from 'mongoose'

const conversationSchema = new mongoose.Schema(
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
    lastMessageAt: {
      type: Date,
      default: Date.now
    },
    lastMessageText: {
      type: String,
      trim: true,
      default: ''
    },
    lastSender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    unreadCountTenant: {
      type: Number,
      default: 0,
      min: 0
    },
    unreadCountManager: {
      type: Number,
      default: 0,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
)

conversationSchema.index({ property: 1, tenant: 1, manager: 1 }, { unique: true })
conversationSchema.index({ tenant: 1, lastMessageAt: -1 })
conversationSchema.index({ manager: 1, lastMessageAt: -1 })

export default mongoose.model('Conversation', conversationSchema)
