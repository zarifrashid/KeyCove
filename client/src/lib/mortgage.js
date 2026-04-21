export function formatCurrency(value) {
  return `৳ ${Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number(value || 0) % 1 === 0 ? 0 : 2
  })}`
}

export function formatPercent(value) {
  return `${Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  })}%`
}

export function getSalePrice(property) {
  if (Number(property?.salePrice) > 0) return Number(property.salePrice)
  if (property?.listingType === 'sale' && Number(property?.price) > 0) return Number(property.price)
  return 0
}

export function buildMortgageDefaults({ propertyId = '', propertyPrice = '', propertyTitle = '' } = {}) {
  const numericPrice = Number(propertyPrice) > 0 ? Number(propertyPrice) : 0
  const defaultDownPayment = numericPrice > 0 ? Math.round(numericPrice * 0.2) : ''

  return {
    propertyId,
    propertyTitle,
    propertyPrice: numericPrice > 0 ? String(numericPrice) : '',
    downPayment: defaultDownPayment === '' ? '' : String(defaultDownPayment),
    interestRate: '9',
    loanTermYears: '20',
    recurringCosts: {
      propertyTax: '',
      insurance: '',
      hoaFee: '',
      maintenance: '',
      utilities: '',
      other: ''
    },
    oneTimeCosts: {
      processingFees: '',
      registrationFees: '',
      legalFees: '',
      other: ''
    }
  }
}

function normalizeNumericField(value) {
  if (value === '' || value === null || value === undefined) return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function buildMortgagePayload(form) {
  return {
    propertyId: form.propertyId || undefined,
    propertyPrice: normalizeNumericField(form.propertyPrice),
    downPayment: normalizeNumericField(form.downPayment),
    interestRate: normalizeNumericField(form.interestRate),
    loanTermYears: normalizeNumericField(form.loanTermYears),
    recurringCosts: Object.fromEntries(
      Object.entries(form.recurringCosts || {}).map(([key, value]) => [key, normalizeNumericField(value)])
    ),
    oneTimeCosts: Object.fromEntries(
      Object.entries(form.oneTimeCosts || {}).map(([key, value]) => [key, normalizeNumericField(value)])
    )
  }
}

export function getDownPaymentPercent(form) {
  const price = Number(form?.propertyPrice) || 0
  const downPayment = Number(form?.downPayment) || 0
  if (price <= 0) return 0
  return (downPayment / price) * 100
}
