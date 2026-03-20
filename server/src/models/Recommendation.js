import mongoose from 'mongoose'

const recommendationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true
    },
    score: {
      type: Number,
      default: 0
    },
    reason: {
      type: String,
      trim: true,
      default: ''
    },
    algorithmVersion: {
      type: String,
      default: 'v1-hybrid'
    },
    statusShown: {
      type: Boolean,
      default: false
    },
    feedbackType: {
      type: String,
      enum: ['none', 'clicked', 'saved', 'not_interested'],
      default: 'none'
    },
    source: {
      type: String,
      enum: ['hybrid', 'cold_start'],
      default: 'hybrid'
    },
    metadata: {
      areaMatch: { type: Boolean, default: false },
      priceMatch: { type: Boolean, default: false },
      propertyTypeMatch: { type: Boolean, default: false },
      collaborativeBoost: { type: Number, default: 0 },
      contentScore: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
)

recommendationSchema.index({ user: 1, property: 1 }, { unique: true })
recommendationSchema.index({ user: 1, createdAt: -1 })

export default mongoose.model('Recommendation', recommendationSchema)
