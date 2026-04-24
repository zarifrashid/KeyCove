import mongoose from 'mongoose'

const boardNotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SharedBoard',
      required: true,
      index: true
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    type: {
      type: String,
      enum: ['invite', 'invite_accepted', 'invite_declined', 'item_added', 'item_removed', 'comment', 'vote', 'member_left', 'board_created'],
      required: true
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
      maxlength: 600
    },
    relatedEntityType: {
      type: String,
      default: ''
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
)

boardNotificationSchema.index({ user: 1, board: 1, createdAt: -1 })
boardNotificationSchema.index({ board: 1, createdAt: -1 })

export default mongoose.model('BoardNotification', boardNotificationSchema)
