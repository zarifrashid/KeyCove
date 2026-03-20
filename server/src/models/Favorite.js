import mongoose from 'mongoose'

const favoriteSchema = new mongoose.Schema(
  {
    tenant: {
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
    }
  },
  { timestamps: true }
)

favoriteSchema.index({ tenant: 1, property: 1 }, { unique: true })

export default mongoose.model('Favorite', favoriteSchema)
