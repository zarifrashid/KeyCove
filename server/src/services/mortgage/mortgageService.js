function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function roundCurrency(value) {
  return Math.round((Number(value) || 0) * 100) / 100
}

function sumValues(values = []) {
  return values.reduce((total, value) => total + (Number(value) || 0), 0)
}

export function getListingSalePrice(property = null) {
  if (!property) return 0
  if (Number(property.salePrice) > 0) return Number(property.salePrice)
  if (property.listingType === 'sale' && Number(property.price) > 0) return Number(property.price)
  return 0
}

export function validateMortgageInput(input = {}, propertyContext = null) {
  const priceFallback = getListingSalePrice(propertyContext)
  const propertyPrice = toNumber(input.propertyPrice, priceFallback)
  const downPayment = toNumber(input.downPayment, propertyPrice * 0.2)
  const annualInterestRate = toNumber(input.interestRate, 9)
  const loanTermYears = toNumber(input.loanTermYears, 20)

  if (propertyPrice <= 0) {
    return 'Property price must be greater than 0.'
  }

  if (downPayment < 0) {
    return 'Down payment cannot be negative.'
  }

  if (downPayment > propertyPrice) {
    return 'Down payment cannot be greater than the property price.'
  }

  if (annualInterestRate < 0 || annualInterestRate > 100) {
    return 'Interest rate must be between 0 and 100.'
  }

  if (loanTermYears <= 0 || loanTermYears > 50) {
    return 'Loan term must be between 1 and 50 years.'
  }

  const recurringCosts = input.recurringCosts || {}
  const oneTimeCosts = input.oneTimeCosts || {}
  const allCosts = [
    recurringCosts.propertyTax,
    recurringCosts.insurance,
    recurringCosts.hoaFee,
    recurringCosts.maintenance,
    recurringCosts.utilities,
    recurringCosts.other,
    oneTimeCosts.processingFees,
    oneTimeCosts.registrationFees,
    oneTimeCosts.legalFees,
    oneTimeCosts.other
  ]

  const hasNegativeCost = allCosts.some((item) => Number(item) < 0)
  if (hasNegativeCost) {
    return 'Cost inputs cannot be negative.'
  }

  return ''
}

export function calculateMortgageEstimate(input = {}, propertyContext = null) {
  const baseListingPrice = getListingSalePrice(propertyContext)
  const propertyPrice = roundCurrency(toNumber(input.propertyPrice, baseListingPrice))
  const downPayment = roundCurrency(toNumber(input.downPayment, propertyPrice * 0.2))
  const loanAmount = roundCurrency(Math.max(0, propertyPrice - downPayment))
  const annualInterestRate = roundCurrency(Math.max(0, toNumber(input.interestRate, 9)))
  const loanTermYears = Math.max(1, toNumber(input.loanTermYears, 20))
  const loanTermMonths = Math.max(1, Math.round(loanTermYears * 12))
  const monthlyInterestRate = annualInterestRate / 100 / 12

  const recurringCosts = {
    propertyTax: roundCurrency(Math.max(0, toNumber(input.recurringCosts?.propertyTax, 0))),
    insurance: roundCurrency(Math.max(0, toNumber(input.recurringCosts?.insurance, 0))),
    hoaFee: roundCurrency(Math.max(0, toNumber(input.recurringCosts?.hoaFee, 0))),
    maintenance: roundCurrency(Math.max(0, toNumber(input.recurringCosts?.maintenance, 0))),
    utilities: roundCurrency(Math.max(0, toNumber(input.recurringCosts?.utilities, 0))),
    other: roundCurrency(Math.max(0, toNumber(input.recurringCosts?.other, 0)))
  }

  const oneTimeCosts = {
    processingFees: roundCurrency(Math.max(0, toNumber(input.oneTimeCosts?.processingFees, 0))),
    registrationFees: roundCurrency(Math.max(0, toNumber(input.oneTimeCosts?.registrationFees, 0))),
    legalFees: roundCurrency(Math.max(0, toNumber(input.oneTimeCosts?.legalFees, 0))),
    other: roundCurrency(Math.max(0, toNumber(input.oneTimeCosts?.other, 0)))
  }

  let monthlyMortgagePayment = 0
  if (loanAmount > 0) {
    if (monthlyInterestRate === 0) {
      monthlyMortgagePayment = loanAmount / loanTermMonths
    } else {
      const growthFactor = Math.pow(1 + monthlyInterestRate, loanTermMonths)
      monthlyMortgagePayment = loanAmount * ((monthlyInterestRate * growthFactor) / (growthFactor - 1))
    }
  }

  monthlyMortgagePayment = roundCurrency(monthlyMortgagePayment)

  const totalRepayment = roundCurrency(monthlyMortgagePayment * loanTermMonths)
  const totalInterest = roundCurrency(Math.max(0, totalRepayment - loanAmount))
  const monthlyRecurringCosts = roundCurrency(sumValues(Object.values(recurringCosts)))
  const totalMonthlyOwnershipCost = roundCurrency(monthlyMortgagePayment + monthlyRecurringCosts)
  const totalOneTimeCosts = roundCurrency(sumValues(Object.values(oneTimeCosts)))
  const totalUpfrontCashNeeded = roundCurrency(downPayment + totalOneTimeCosts)
  const downPaymentPercent = propertyPrice > 0 ? roundCurrency((downPayment / propertyPrice) * 100) : 0

  return {
    property: propertyContext
      ? {
          propertyId: propertyContext._id,
          title: propertyContext.title,
          listingType: propertyContext.listingType,
          baseListingPrice: roundCurrency(baseListingPrice)
        }
      : null,
    input: {
      propertyPrice,
      downPayment,
      downPaymentPercent,
      loanAmount,
      annualInterestRate,
      monthlyInterestRate: roundCurrency(monthlyInterestRate * 100),
      loanTermYears,
      loanTermMonths,
      recurringCosts,
      oneTimeCosts
    },
    summary: {
      loanAmount,
      monthlyMortgagePayment,
      totalRepayment,
      totalInterest,
      monthlyRecurringCosts,
      totalMonthlyOwnershipCost,
      totalOneTimeCosts,
      totalUpfrontCashNeeded
    },
    monthlyBreakdown: [
      { key: 'mortgage', label: 'Mortgage payment', value: monthlyMortgagePayment },
      { key: 'propertyTax', label: 'Property tax estimate', value: recurringCosts.propertyTax },
      { key: 'insurance', label: 'Insurance estimate', value: recurringCosts.insurance },
      { key: 'hoaFee', label: 'HOA / service charge', value: recurringCosts.hoaFee },
      { key: 'maintenance', label: 'Maintenance reserve', value: recurringCosts.maintenance },
      { key: 'utilities', label: 'Utilities estimate', value: recurringCosts.utilities },
      { key: 'other', label: 'Other monthly cost', value: recurringCosts.other }
    ],
    oneTimeBreakdown: [
      { key: 'processingFees', label: 'Loan processing fees', value: oneTimeCosts.processingFees },
      { key: 'registrationFees', label: 'Registration / closing fees', value: oneTimeCosts.registrationFees },
      { key: 'legalFees', label: 'Legal / documentation fees', value: oneTimeCosts.legalFees },
      { key: 'other', label: 'Other upfront cost', value: oneTimeCosts.other }
    ],
    notes: [
      'Mortgage payment uses the standard amortized loan formula based on principal, interest rate, and loan term.',
      annualInterestRate === 0
        ? 'Zero-interest case: principal is divided evenly across the full loan term.'
        : 'Interest is converted to a monthly rate using annual rate ÷ 12.',
      propertyContext
        ? 'Listing price was prefilled from the selected sale property. You can still adjust the numbers for scenario planning.'
        : 'This is a manual ownership estimate. Adjust every field to match your scenario.',
      'Recurring tax, insurance, HOA, maintenance, utilities, and other monthly costs are user-entered estimates because the current listing schema does not store those numeric ownership fields.'
    ]
  }
}
