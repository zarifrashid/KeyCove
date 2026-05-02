import mongoose from 'mongoose'

const faqSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true
    },
    question: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    answer: {
      type: String,
      required: true,
      trim: true
    },
    keywords: {
      type: [String],
      default: []
    },
    role: {
      type: String,
      enum: ['tenant', 'manager', 'admin'],
      default: 'tenant',
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    sortOrder: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
)

faqSchema.index({ role: 1, isActive: 1, category: 1, sortOrder: 1 })
faqSchema.index({ question: 'text', answer: 'text', category: 'text', keywords: 'text' })

export default mongoose.model('Faq', faqSchema)
