import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000
    },
    messageType: {
      type: String,
      enum: ['text'],
      default: 'text'
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date,
      default: null
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
)

messageSchema.index({ conversation: 1, sentAt: 1 })

export default mongoose.model('Message', messageSchema)
