import mongoose from 'mongoose'

const mortgageCalculationSchema = new mongoose.Schema(
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
      default: null,
      index: true
    },
    listingPrice: {
      type: Number,
      required: true,
      min: 0
    },
    downPaymentPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    loanTermYears: {
      type: Number,
      required: true,
      min: 1
    },
    interestRate: {
      type: Number,
      required: true,
      min: 0
    },
    estimatedTax: {
      type: Number,
      default: 0,
      min: 0
    },
    estimatedInsurance: {
      type: Number,
      default: 0,
      min: 0
    },
    estimatedUtilities: {
      type: Number,
      default: 0,
      min: 0
    },
    hoaFee: {
      type: Number,
      default: 0,
      min: 0
    },
    monthlyPayment: {
      type: Number,
      required: true,
      min: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_, ret) => {
        ret.calculationId = ret._id?.toString()
        delete ret._id
        return ret
      }
    }
  }
)

mortgageCalculationSchema.index({ userId: 1, createdAt: -1 })
mortgageCalculationSchema.index({ propertyId: 1, createdAt: -1 })

export default mongoose.model('MortgageCalculation', mortgageCalculationSchema)
