import mongoose from 'mongoose'

const boardItemSchema = new mongoose.Schema(
  {
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SharedBoard',
      required: true,
      index: true
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    note: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
)

boardItemSchema.index({ board: 1, property: 1 }, { unique: true })
boardItemSchema.index({ board: 1, addedAt: -1 })

export default mongoose.model('BoardItem', boardItemSchema)
