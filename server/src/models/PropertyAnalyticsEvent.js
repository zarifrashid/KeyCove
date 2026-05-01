import mongoose from 'mongoose'

export const PROPERTY_ANALYTICS_EVENT_TYPES = [
  'view',
  'favorite',
  'unfavorite',
  'request_submit',
  'message_inquiry',
  'design_room_open',
  'compare_add',
  'compare_remove'
]

const propertyAnalyticsEventSchema = new mongoose.Schema(
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
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    eventType: {
      type: String,
      enum: PROPERTY_ANALYTICS_EVENT_TYPES,
      required: true,
      index: true
    },
    sessionId: {
      type: String,
      trim: true,
      default: ''
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
)

propertyAnalyticsEventSchema.index({ property: 1, eventType: 1, createdAt: -1 })
propertyAnalyticsEventSchema.index({ manager: 1, createdAt: -1 })
propertyAnalyticsEventSchema.index({ user: 1, property: 1, eventType: 1, createdAt: -1 })
propertyAnalyticsEventSchema.index({ sessionId: 1, property: 1, eventType: 1, createdAt: -1 })

export default mongoose.model('PropertyAnalyticsEvent', propertyAnalyticsEventSchema)
