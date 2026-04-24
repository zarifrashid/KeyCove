import mongoose from 'mongoose'

const boardMemberSchema = new mongoose.Schema(
  {
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SharedBoard',
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ['owner', 'member'],
      default: 'member'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'left'],
      default: 'pending'
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    invitedAt: {
      type: Date,
      default: Date.now
    },
    joinedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
)

boardMemberSchema.index({ board: 1, user: 1 }, { unique: true })
boardMemberSchema.index({ user: 1, status: 1, invitedAt: -1 })

export default mongoose.model('BoardMember', boardMemberSchema)
