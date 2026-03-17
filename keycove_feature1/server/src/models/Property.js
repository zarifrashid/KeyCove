import mongoose from 'mongoose'

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
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
      enum: ['active', 'inactive'],
      default: 'active'
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
      min: 100
    },
    image: {
      type: String,
      required: true
    },
    imageAlt: {
      type: String,
      default: 'Property photo'
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amenities: [{ type: String }],
    location: {
      address: { type: String, required: true, trim: true },
      area: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true, default: 'Dhaka' },
      postalCode: { type: String, trim: true, default: '' },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    },
    geoLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true,
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

export default mongoose.model('Property', propertySchema)
