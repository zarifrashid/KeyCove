import mongoose from 'mongoose'

const searchQuerySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    searchText: {
      type: String,
      trim: true,
      default: ''
    },
    area: {
      type: String,
      trim: true,
      default: ''
    },
    center: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null }
    },
    bounds: {
      northEastLat: { type: Number, default: null },
      northEastLng: { type: Number, default: null },
      southWestLat: { type: Number, default: null },
      southWestLng: { type: Number, default: null }
    },
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
      amenities: [{ type: String }],
      availableFrom: { type: String, default: null },
      postedAfter: { type: String, default: null }
    },
    sortOption: {
      type: String,
      default: 'newest'
    },
    zoom: {
      type: Number,
      default: 12
    },
    page: {
      type: Number,
      default: 1
    },
    pageSize: {
      type: Number,
      default: 9
    },
    resultCount: {
      type: Number,
      default: 0
    },
    source: {
      type: String,
      enum: ['initial', 'search', 'current-location', 'map-move', 'reset', 'filter'],
      default: 'initial'
    }
  },
  { timestamps: true }
)

export default mongoose.model('SearchQuery', searchQuerySchema)
