import MortgageCalculation from '../models/MortgageCalculation.js'
import Property from '../models/Property.js'
import { calculateMortgageScenario } from '../services/mortgage/mortgageService.js'

function validateBody(body = {}) {
  const fields = [
    ['listingPrice', 'Listing price'],
    ['downPaymentPercent', 'Down payment percentage'],
    ['loanTermYears', 'Loan term'],
    ['interestRate', 'Interest rate'],
    ['estimatedTax', 'Estimated tax'],
    ['estimatedInsurance', 'Estimated insurance'],
    ['estimatedUtilities', 'Estimated utilities'],
    ['hoaFee', 'HOA / service charge']
  ]

  for (const [field, label] of fields) {
    const value = Number(body[field] ?? 0)
    if (!Number.isFinite(value) || value < 0) {
      return `${label} must be 0 or more.`
    }
  }

  if (Number(body.listingPrice) <= 0) {
    return 'Listing price must be greater than 0.'
  }

  if (Number(body.downPaymentPercent) > 100) {
    return 'Down payment percentage cannot exceed 100.'
  }

  if (Number(body.loanTermYears) <= 0) {
    return 'Loan term must be greater than 0.'
  }

  return ''
}

async function loadSaleProperty(propertyId) {
  const property = await Property.findById(propertyId).lean()
  if (!property) {
    const error = new Error('Property not found.')
    error.statusCode = 404
    throw error
  }

  if (property.listingType !== 'sale') {
    const error = new Error('Mortgage calculator is available for sale listings only.')
    error.statusCode = 400
    throw error
  }

  return property
}

function buildCalculationResponse(calculation) {
  return {
    ...calculation.toJSON(),
    calculationId: calculation.toJSON().calculationId
  }
}

export async function calculateMortgage(req, res) {
  try {
    const validationError = validateBody(req.body)
    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    const result = calculateMortgageScenario(req.body)
    res.status(200).json({ success: true, result })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to calculate mortgage.' })
  }
}

export async function calculateMortgageForProperty(req, res) {
  try {
    const property = await loadSaleProperty(req.params.propertyId)
    const payload = { ...req.body, listingPrice: property.price }
    const validationError = validateBody(payload)
    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    const result = calculateMortgageScenario(payload)
    res.status(200).json({ success: true, property, result })
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Failed to calculate property mortgage.' })
  }
}

export async function saveMortgageCalculation(req, res) {
  try {
    const validationError = validateBody(req.body)
    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    const result = calculateMortgageScenario(req.body)
    const calculation = await MortgageCalculation.create({
      userId: req.user.userId,
      propertyId: req.body.propertyId || null,
      listingPrice: result.inputs.listingPrice,
      downPaymentPercent: result.inputs.downPaymentPercent,
      loanTermYears: result.inputs.loanTermYears,
      interestRate: result.inputs.interestRate,
      estimatedTax: result.inputs.estimatedTax,
      estimatedInsurance: result.inputs.estimatedInsurance,
      estimatedUtilities: result.inputs.estimatedUtilities,
      hoaFee: result.inputs.hoaFee,
      monthlyPayment: result.summary.monthlyPayment,
      createdAt: new Date()
    })

    res.status(201).json({
      success: true,
      message: 'Mortgage scenario saved.',
      result,
      calculation: buildCalculationResponse(calculation)
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to save mortgage calculation.' })
  }
}

export async function saveMortgageCalculationForProperty(req, res) {
  try {
    const property = await loadSaleProperty(req.params.propertyId)
    const payload = { ...req.body, listingPrice: property.price, propertyId: property._id }
    const validationError = validateBody(payload)
    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    const result = calculateMortgageScenario(payload)
    const calculation = await MortgageCalculation.create({
      userId: req.user.userId,
      propertyId: property._id,
      listingPrice: result.inputs.listingPrice,
      downPaymentPercent: result.inputs.downPaymentPercent,
      loanTermYears: result.inputs.loanTermYears,
      interestRate: result.inputs.interestRate,
      estimatedTax: result.inputs.estimatedTax,
      estimatedInsurance: result.inputs.estimatedInsurance,
      estimatedUtilities: result.inputs.estimatedUtilities,
      hoaFee: result.inputs.hoaFee,
      monthlyPayment: result.summary.monthlyPayment,
      createdAt: new Date()
    })

    res.status(201).json({
      success: true,
      message: 'Property mortgage scenario saved.',
      property,
      result,
      calculation: buildCalculationResponse(calculation)
    })
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Failed to save property mortgage calculation.' })
  }
}

export async function getMortgageHistory(req, res) {
  try {
    const filter = { userId: req.user.userId }
    if (req.query.propertyId) {
      filter.propertyId = req.query.propertyId
    }

    const history = await MortgageCalculation.find(filter)
      .sort({ createdAt: -1 })
      .limit(10)
      .lean({ virtuals: true })

    res.status(200).json({ success: true, history })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch mortgage history.' })
  }
}

export async function getLatestMortgageCalculation(req, res) {
  try {
    const filter = { userId: req.user.userId }
    if (req.query.propertyId) {
      filter.propertyId = req.query.propertyId
    }

    const calculation = await MortgageCalculation.findOne(filter)
      .sort({ createdAt: -1 })
      .lean({ virtuals: true })

    res.status(200).json({ success: true, calculation: calculation || null })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch latest mortgage calculation.' })
  }
}
