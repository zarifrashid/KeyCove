import mongoose from 'mongoose'

const interactionLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      default: null,
      index: true
    },
    interactionType: {
      type: String,
      enum: ['search', 'property_view', 'recommendation_click', 'save', 'not_interested'],
      required: true,
      index: true
    },
    source: {
      type: String,
      trim: true,
      default: ''
    },
    searchSnapshot: {
      searchText: { type: String, default: '' },
      area: { type: String, default: '' },
      filters: {
        minPrice: { type: Number, default: null },
        maxPrice: { type: Number, default: null },
        minBeds: { type: Number, default: null },
        maxBeds: { type: Number, default: null },
        minBaths: { type: Number, default: null },
        maxBaths: { type: Number, default: null },
        minSquareFeet: { type: Number, default: null },
        maxSquareFeet: { type: Number, default: null },
        propertyType: [{ type: String }],
        listingType: [{ type: String }],
        amenities: [{ type: String }]
      }
    },
    recommendationContext: {
      recommendationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recommendation',
        default: null
      },
      algorithmVersion: { type: String, default: '' }
    },
    metadata: {
      area: { type: String, default: '' },
      propertyType: { type: String, default: '' },
      listingType: { type: String, default: '' },
      price: { type: Number, default: null }
    }
  },
  { timestamps: true }
)

interactionLogSchema.index({ user: 1, interactionType: 1, createdAt: -1 })

export default mongoose.model('InteractionLog', interactionLogSchema)
