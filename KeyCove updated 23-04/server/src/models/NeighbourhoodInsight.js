import mongoose from 'mongoose'

const nearbyPlaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true
    },
    category: {
      type: String,
      enum: [
        'school',
        'college',
        'mosque',
        'hospital',
        'shopping_mall',
        'park',
        'restaurant',
        'transport',
        'grocery',
        'pharmacy',
        'other'
      ],
      required: true
    },
    distanceMeters: {
      type: Number,
      min: 0,
      default: 0
    },
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    source: {
      type: String,
      trim: true,
      default: 'curated'
    }
  },
  { _id: false }
)

const neighbourhoodInsightSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      unique: true,
      index: true
    },
    area: {
      type: String,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      trim: true,
      default: 'Dhaka'
    },
    supportedAreaKey: {
      type: String,
      trim: true,
      default: ''
    },
    coverageStatus: {
      type: String,
      enum: ['ready', 'pending', 'unsupported', 'failed'],
      default: 'pending'
    },
    message: {
      type: String,
      trim: true,
      default: ''
    },
    summary: {
      type: String,
      trim: true,
      default: ''
    },
    walkScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    transitScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    bikeScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    safetyIndex: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    averageAge: {
      type: Number,
      default: null
    },
    schoolRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    convenienceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    familyFriendlinessScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    neighbourhoodHighlights: [{ type: String }],
    safetyNotes: [{ type: String }],
    nearbyPlaces: [nearbyPlaceSchema],
    sourceMode: {
      type: String,
      enum: ['curated', 'live', 'hybrid'],
      default: 'curated'
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
)

neighbourhoodInsightSchema.index({ coverageStatus: 1, updatedAt: -1 })

export default mongoose.model('NeighbourhoodInsight', neighbourhoodInsightSchema)
