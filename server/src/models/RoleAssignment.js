import mongoose from 'mongoose'

const roleAssignmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    previousRole: {
      type: String,
      enum: ['tenant', 'manager', 'admin'],
      required: true
    },
    newRole: {
      type: String,
      enum: ['tenant', 'manager', 'admin'],
      required: true
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      default: '',
      trim: true
    }
  },
  { timestamps: true }
)

roleAssignmentSchema.index({ user: 1, createdAt: -1 })
roleAssignmentSchema.index({ assignedBy: 1, createdAt: -1 })

export default mongoose.model('RoleAssignment', roleAssignmentSchema)
