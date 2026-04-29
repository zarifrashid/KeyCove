import mongoose from 'mongoose'

const VISIT_STATUSES = ['not_visited', 'scheduled', 'visited', 'shortlisted', 'rejected', 'final_choice']
const DECISION_TAGS = [
  'best_location',
  'best_value',
  'most_spacious',
  'best_furnished',
  'best_for_family',
  'closest_to_work',
  'final_choice',
  'rejected'
]

const checklistItemSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      trim: true,
      required: true
    },
    checked: {
      type: Boolean,
      default: false
    },
    note: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { _id: false }
)

const decisionNoteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true
    },
    visitStatus: {
      type: String,
      enum: VISIT_STATUSES,
      default: 'not_visited'
    },
    personalRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    pros: { type: String, trim: true, default: '' },
    cons: { type: String, trim: true, default: '' },
    questionsForManager: { type: String, trim: true, default: '' },
    privateNotes: { type: String, trim: true, default: '' },
    checklist: {
      type: [checklistItemSchema],
      default: []
    },
    decisionTags: {
      type: [String],
      enum: DECISION_TAGS,
      default: []
    },
    compareSelected: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true }
)

decisionNoteSchema.index({ userId: 1, propertyId: 1 }, { unique: true })
decisionNoteSchema.index({ userId: 1, compareSelected: 1, updatedAt: -1 })
decisionNoteSchema.index({ propertyId: 1, updatedAt: -1 })

export const DECISION_VISIT_STATUSES = VISIT_STATUSES
export const DECISION_TAG_OPTIONS = DECISION_TAGS

export default mongoose.model('DecisionNote', decisionNoteSchema)
