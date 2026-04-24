import mongoose from 'mongoose'

const sharedBoardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    coverProperty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      default: null
    },
    lastActivityAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
)

sharedBoardSchema.index({ owner: 1, lastActivityAt: -1 })

export default mongoose.model('SharedBoard', sharedBoardSchema)
