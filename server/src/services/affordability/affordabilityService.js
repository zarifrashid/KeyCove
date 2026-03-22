import Property from '../../models/Property.js'

function roundCurrency(value) {
  return Math.max(0, Math.round(Number(value) || 0))
}

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function calculateAffordabilityProfile(input = {}) {
  const monthlyIncome = Math.max(0, toNumber(input.monthlyIncome))
  const monthlyDebt = Math.max(0, toNumber(input.monthlyDebt))
  const savingsBuffer = Math.max(0, toNumber(input.savingsBuffer))

  const thirtyPercentCap = monthlyIncome * 0.3
  const afterObligationsCap = monthlyIncome - monthlyDebt - savingsBuffer
  const safeMonthlyRent = roundCurrency(Math.min(thirtyPercentCap, afterObligationsCap))

  const recommendedMinRent = roundCurrency(safeMonthlyRent * 0.85)
  const recommendedMaxRent = roundCurrency(safeMonthlyRent)

  let affordabilityBand = 'budget-safe'
  if (afterObligationsCap < thirtyPercentCap) affordabilityBand = 'debt-constrained'
  else if (safeMonthlyRent < monthlyIncome * 0.25) affordabilityBand = 'tight-budget'

  let interpretation = 'Within your safe rent budget.'
  if (safeMonthlyRent <= 0) {
    interpretation = 'Your current debt and savings targets leave no safe monthly rent budget yet.'
  } else if (affordabilityBand === 'debt-constrained') {
    interpretation = 'Your debt and savings commitments are the main limit on your housing budget.'
  } else if (affordabilityBand === 'tight-budget') {
    interpretation = 'Your housing budget is workable, but it leaves limited breathing room.'
  }

  return {
    monthlyIncome,
    monthlyDebt,
    savingsBuffer,
    thirtyPercentCap: roundCurrency(thirtyPercentCap),
    afterObligationsCap: roundCurrency(afterObligationsCap),
    safeMonthlyRent,
    recommendedMinRent,
    recommendedMaxRent,
    affordabilityBand,
    affordabilityRule: 'min(30_percent_income, income_minus_debt_minus_savings_buffer)',
    explanation: `We compare 30% of your monthly income with the amount left after debt and savings. The lower number becomes your safe monthly rent.`,
    interpretation
  }
}

export function classifyPropertyAffordability(propertyPrice, profile) {
  const safeRent = Number(profile?.safeMonthlyRent) || 0
  const recommendedMaxRent = Number(profile?.recommendedMaxRent) || safeRent
  const recommendedMinRent = Number(profile?.recommendedMinRent) || 0
  const price = Math.max(0, Number(propertyPrice) || 0)

  if (safeRent <= 0) {
    return {
      category: 'unaffordable',
      label: 'Not affordable',
      difference: roundCurrency(price),
      shortMessage: 'No safe rent budget is available from your latest profile.',
      detailMessage: 'Update your affordability inputs to see which rentals fit safely.'
    }
  }

  if (price <= recommendedMaxRent) {
    return {
      category: 'affordable',
      label: 'Affordable',
      difference: roundCurrency(recommendedMaxRent - price),
      shortMessage: 'This listing fits within your safe monthly rent budget.',
      detailMessage: price < recommendedMinRent
        ? 'This listing is comfortably below your recommended range.'
        : 'This listing sits within your recommended affordability range.'
    }
  }

  if (price <= safeRent * 1.1) {
    return {
      category: 'borderline',
      label: 'Borderline',
      difference: roundCurrency(price - recommendedMaxRent),
      shortMessage: 'This listing is slightly above your recommended range.',
      detailMessage: 'It may still work, but it leaves you with less monthly flexibility.'
    }
  }

  if (price <= safeRent * 1.25) {
    return {
      category: 'stretched',
      label: 'Stretched',
      difference: roundCurrency(price - recommendedMaxRent),
      shortMessage: 'This listing would stretch your current budget.',
      detailMessage: 'Expect less room for debt, savings, and unexpected expenses.'
    }
  }

  return {
    category: 'unaffordable',
    label: 'Unaffordable',
    difference: roundCurrency(price - recommendedMaxRent),
    shortMessage: 'This listing is well above your recommended affordability range.',
    detailMessage: 'Consider lower-rent listings or update your affordability inputs.'
  }
}

export async function buildPropertyAffordabilitySummary(propertyId, profile) {
  const property = await Property.findById(propertyId).select('title price listingType status').lean()
  if (!property || property.status === 'deleted') {
    const error = new Error('Property not found.')
    error.statusCode = 404
    throw error
  }

  if (property.listingType !== 'rent') {
    return {
      propertyId: property._id,
      propertyTitle: property.title,
      listingType: property.listingType,
      applicable: false,
      message: 'Affordability analysis is currently available for rent listings only.'
    }
  }

  const classification = classifyPropertyAffordability(property.price, profile)

  return {
    propertyId: property._id,
    propertyTitle: property.title,
    listingType: property.listingType,
    applicable: true,
    price: property.price,
    safeMonthlyRent: profile.safeMonthlyRent,
    recommendedMinRent: profile.recommendedMinRent,
    recommendedMaxRent: profile.recommendedMaxRent,
    ...classification
  }
}
