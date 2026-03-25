import mongoose from 'mongoose'

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    price: {
      type: Number,
      min: 0,
      default: 0
    },
    propertyType: {
      type: String,
      enum: ['Apartment', 'Condo', 'Studio', 'Family Home'],
      default: 'Apartment'
    },
    listingType: {
      type: String,
      enum: ['rent', 'sale'],
      default: 'rent'
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'inactive', 'deleted'],
      default: 'draft'
    },
    bedrooms: {
      type: Number,
      default: 1,
      min: 0
    },
    bathrooms: {
      type: Number,
      default: 1,
      min: 0
    },
    squareFeet: {
      type: Number,
      default: 600,
      min: 0
    },
    availableFrom: {
      type: Date,
      default: Date.now
    },
    image: {
      type: String,
      default: ''
    },
    imageAlt: {
      type: String,
      default: 'Property photo'
    },
    images: [
      {
        url: {
          type: String,
          trim: true
        },
        sortOrder: {
          type: Number,
          default: 0
        },
        isCover: {
          type: Boolean,
          default: false
        },
        source: {
          type: String,
          default: 'url'
        },
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amenities: [{ type: String }],
    policies: {
      utilities: { type: String, default: '' },
      pet: { type: String, default: '' },
      income: { type: String, default: '' }
    },
    nearbyPlaces: {
      school: { type: String, default: '' },
      bus: { type: String, default: '' },
      restaurant: { type: String, default: '' }
    },
    location: {
      address: { type: String, trim: true, default: '' },
      area: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: 'Dhaka' },
      postalCode: { type: String, trim: true, default: '' },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null }
    },
    geoLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [90.4125, 23.8103],
        validate: {
          validator: (value) => Array.isArray(value) && value.length === 2,
          message: 'Coordinates must contain [longitude, latitude]'
        }
      }
    }
  },
  { timestamps: true }
)

propertySchema.index({ geoLocation: '2dsphere' })
propertySchema.index({ status: 1, 'location.area': 1, price: 1 })
propertySchema.index({ status: 1, price: 1 })
propertySchema.index({ status: 1, bedrooms: 1 })
propertySchema.index({ status: 1, bathrooms: 1 })
propertySchema.index({ status: 1, squareFeet: 1 })
propertySchema.index({ status: 1, propertyType: 1 })
propertySchema.index({ status: 1, listingType: 1 })
propertySchema.index({ amenities: 1 })
propertySchema.index({ createdAt: -1 })

export default mongoose.model('Property', propertySchema)
