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
      latitude: Number,
      longitude: Number
    },
    zoom: {
      type: Number,
      default: 12
    },
    page: {
      type: Number,
      default: 1
    },
    resultCount: {
      type: Number,
      default: 0
    },
    source: {
      type: String,
      enum: ['initial', 'search', 'current-location', 'map-move', 'reset'],
      default: 'initial'
    }
  },
  { timestamps: true }
)

export default mongoose.model('SearchQuery', searchQuerySchema)
