import mongoose from 'mongoose'

const affordabilityAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    monthlyIncome: {
      type: Number,
      required: true,
      min: 0
    },
    monthlyDebt: {
      type: Number,
      default: 0,
      min: 0
    },
    savingsBuffer: {
      type: Number,
      default: 0,
      min: 0
    },
    safeMonthlyRent: {
      type: Number,
      required: true,
      min: 0
    },
    recommendedMinRent: {
      type: Number,
      required: true,
      min: 0
    },
    recommendedMaxRent: {
      type: Number,
      required: true,
      min: 0
    },
    affordabilityBand: {
      type: String,
      enum: ['budget-safe', 'tight-budget', 'debt-constrained'],
      default: 'budget-safe'
    },
    affordabilityRule: {
      type: String,
      default: 'min(30_percent_income, income_minus_debt_minus_savings_buffer)',
      trim: true
    }
  },
  { timestamps: true }
)

affordabilityAnalysisSchema.index({ userId: 1, createdAt: -1 })

export default mongoose.model('AffordabilityAnalysis', affordabilityAnalysisSchema)
