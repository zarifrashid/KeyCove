import mongoose from 'mongoose'

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1500
    },
    createdByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    targetRole: {
      type: String,
      enum: ['all', 'tenant', 'manager', 'admin'],
      default: 'all',
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'critical'],
      default: 'normal'
    },
    expiresAt: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
)

announcementSchema.index({ targetRole: 1, isActive: 1, createdAt: -1 })
announcementSchema.index({ expiresAt: 1 })

export default mongoose.model('Announcement', announcementSchema)
