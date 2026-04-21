import Property from '../models/Property.js'
import { calculateMortgageEstimate, validateMortgageInput } from '../services/mortgage/mortgageService.js'

async function resolvePropertyContext(propertyId) {
  if (!propertyId) return null

  const property = await Property.findById(propertyId)
    .select('_id title price salePrice listingType status')
    .lean()

  if (!property || property.status === 'deleted' || property.status !== 'active') {
    const error = new Error('Sale property not found.')
    error.statusCode = 404
    throw error
  }

  if (property.listingType !== 'sale') {
    const error = new Error('Mortgage calculator applies to sale listings only.')
    error.statusCode = 400
    throw error
  }

  return property
}

export async function calculateMortgage(req, res) {
  try {
    const propertyContext = await resolvePropertyContext(req.body?.propertyId)
    const validationError = validateMortgageInput(req.body, propertyContext)

    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    const estimate = calculateMortgageEstimate(req.body, propertyContext)

    return res.status(200).json({
      success: true,
      estimate
    })
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Failed to calculate mortgage estimate.'
    })
  }
}
