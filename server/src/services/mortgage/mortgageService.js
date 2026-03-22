export function roundCurrency(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100
}

function sanitizeNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function calculateMortgageScenario(payload = {}) {
  const listingPrice = Math.max(0, sanitizeNumber(payload.listingPrice))
  const downPaymentPercent = Math.min(100, Math.max(0, sanitizeNumber(payload.downPaymentPercent)))
  const loanTermYears = Math.max(1, sanitizeNumber(payload.loanTermYears, 20))
  const interestRate = Math.max(0, sanitizeNumber(payload.interestRate, 0))
  const estimatedTax = Math.max(0, sanitizeNumber(payload.estimatedTax))
  const estimatedInsurance = Math.max(0, sanitizeNumber(payload.estimatedInsurance))
  const estimatedUtilities = Math.max(0, sanitizeNumber(payload.estimatedUtilities))
  const hoaFee = Math.max(0, sanitizeNumber(payload.hoaFee))

  const downPaymentAmount = roundCurrency(listingPrice * (downPaymentPercent / 100))
  const loanAmount = roundCurrency(Math.max(0, listingPrice - downPaymentAmount))
  const totalMonths = Math.max(1, Math.round(loanTermYears * 12))
  const monthlyInterestRate = interestRate / 100 / 12

  let monthlyPayment = 0
  if (loanAmount <= 0) {
    monthlyPayment = 0
  } else if (monthlyInterestRate === 0) {
    monthlyPayment = loanAmount / totalMonths
  } else {
    monthlyPayment = loanAmount * (
      (monthlyInterestRate * (1 + monthlyInterestRate) ** totalMonths)
      / (((1 + monthlyInterestRate) ** totalMonths) - 1)
    )
  }

  monthlyPayment = roundCurrency(monthlyPayment)
  const totalRepayment = roundCurrency(monthlyPayment * totalMonths)
  const totalInterest = roundCurrency(Math.max(0, totalRepayment - loanAmount))
  const monthlyRecurringCosts = roundCurrency(estimatedTax + estimatedInsurance + estimatedUtilities + hoaFee)
  const totalMonthlyOwnershipCost = roundCurrency(monthlyPayment + monthlyRecurringCosts)

  return {
    inputs: {
      listingPrice,
      downPaymentPercent,
      loanTermYears,
      interestRate,
      estimatedTax,
      estimatedInsurance,
      estimatedUtilities,
      hoaFee
    },
    summary: {
      downPaymentAmount,
      loanAmount,
      totalMonths,
      monthlyPayment,
      totalRepayment,
      totalInterest,
      monthlyRecurringCosts,
      totalMonthlyOwnershipCost,
      upfrontCashRequired: downPaymentAmount
    },
    assumptions: {
      monthlyPaymentFormula: monthlyInterestRate === 0
        ? 'Zero-interest fallback: principal divided by total loan months.'
        : 'Standard amortized loan formula using principal, monthly interest rate, and loan term.',
      ownershipCostFormula: 'Monthly ownership cost = monthly mortgage + property tax + insurance + utilities + HOA/service charge.'
    }
  }
}
