import mongoose from 'mongoose'

const weightedStringSchema = new mongoose.Schema(
  {
    value: { type: String, trim: true, required: true },
    score: { type: Number, default: 0 }
  },
  { _id: false }
)

const userPreferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    preferredAreas: [weightedStringSchema],
    dislikedAreas: [weightedStringSchema],
    preferredPropertyTypes: [weightedStringSchema],
    preferredListingTypes: [weightedStringSchema],
    preferredAmenities: [weightedStringSchema],
    preferredBedrooms: {
      min: { type: Number, default: null },
      max: { type: Number, default: null },
      average: { type: Number, default: null }
    },
    preferredBathrooms: {
      min: { type: Number, default: null },
      max: { type: Number, default: null },
      average: { type: Number, default: null }
    },
    preferredPriceRange: {
      min: { type: Number, default: null },
      max: { type: Number, default: null },
      average: { type: Number, default: null }
    },
    lastSignalsSummary: {
      type: String,
      default: ''
    },
    onboardingCompleted: {
      type: Boolean,
      default: false
    },
    onboardingSource: {
      type: String,
      default: ''
    },
    onboardingAnswers: {
      preferredArea: { type: String, default: '' },
      budgetMin: { type: Number, default: null },
      budgetMax: { type: Number, default: null },
      propertyType: { type: String, default: '' },
      bedrooms: { type: Number, default: null },
      listingType: { type: String, default: '' },
      mustHaveAmenity: { type: String, default: '' }
    },
    algorithmVersion: {
      type: String,
      default: 'v1-hybrid'
    },
    lastInferredAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
)

export default mongoose.model('UserPreference', userPreferenceSchema)
