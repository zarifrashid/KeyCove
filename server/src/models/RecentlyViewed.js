import mongoose from 'mongoose'

const recentlyViewedSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true
    },
    viewedAt: {
      type: Date,
      required: true,
      default: Date.now
    }
  },
  { timestamps: true }
)

recentlyViewedSchema.index({ user: 1, property: 1 }, { unique: true })
recentlyViewedSchema.index({ user: 1, viewedAt: -1 })
recentlyViewedSchema.index({ property: 1 })

export default mongoose.model('RecentlyViewed', recentlyViewedSchema)
