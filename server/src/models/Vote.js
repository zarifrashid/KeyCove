import mongoose from 'mongoose'

const voteSchema = new mongoose.Schema(
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
    voteType: {
      type: String,
      enum: ['upvote', 'downvote'],
      required: true
    }
  },
  { timestamps: true }
)

voteSchema.index({ boardItem: 1, user: 1 }, { unique: true })

export default mongoose.model('Vote', voteSchema)
