import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    body: {
      type: String,
      trim: true,
      default: '',
      maxlength: 700
    },
    type: {
      type: String,
      enum: ['message', 'application', 'system', 'lease', 'payment', 'announcement'],
      required: true,
      index: true
    },
    relatedEntityType: {
      type: String,
      default: '',
      trim: true
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    actionUrl: {
      type: String,
      default: '',
      trim: true
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'critical'],
      default: 'normal',
      index: true
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
)

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 })
notificationSchema.index({ user: 1, createdAt: -1 })
notificationSchema.index({ relatedEntityType: 1, relatedEntityId: 1 })

export default mongoose.model('Notification', notificationSchema)
