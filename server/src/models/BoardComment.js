import mongoose from 'mongoose'

const boardCommentSchema = new mongoose.Schema(
  {
    boardItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BoardItem',
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1500
    }
  },
  { timestamps: true }
)

boardCommentSchema.index({ boardItem: 1, createdAt: 1 })

export default mongoose.model('BoardComment', boardCommentSchema)
