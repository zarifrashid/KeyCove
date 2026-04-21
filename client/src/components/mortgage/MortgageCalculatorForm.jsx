import { getDownPaymentPercent } from '../../lib/mortgage'

const RECURRING_FIELDS = [
  { key: 'propertyTax', label: 'Property tax estimate (monthly)' },
  { key: 'insurance', label: 'Insurance estimate (monthly)' },
  { key: 'hoaFee', label: 'HOA / service charge (monthly)' },
  { key: 'maintenance', label: 'Maintenance reserve (monthly)' },
  { key: 'utilities', label: 'Utilities estimate (monthly)' },
  { key: 'other', label: 'Other monthly ownership cost' }
]

const ONE_TIME_FIELDS = [
  { key: 'processingFees', label: 'Loan processing fees' },
  { key: 'registrationFees', label: 'Registration / closing fees' },
  { key: 'legalFees', label: 'Legal / documentation fees' },
  { key: 'other', label: 'Other upfront cost' }
]

function NumberInput({ label, value, onChange, min = '0', max = undefined, step = '0.01', helperText = '' }) {
  return (
    <label className="mortgage-field">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {helperText ? <small>{helperText}</small> : null}
    </label>
  )
}

export default function MortgageCalculatorForm({
  form,
  onFieldChange,
  onCostChange,
  onSubmit,
  onReset,
  loading,
  submitLabel = 'Calculate ownership cost',
  showContext = false,
  contextTitle = ''
}) {
  const downPaymentPercent = getDownPaymentPercent(form)

  return (
    <div className="mortgage-form-shell">
      {showContext ? (
        <div className="mortgage-context-banner">
          <div>
            <h3>{contextTitle || 'Property-linked ownership calculator'}</h3>
            <p>Sale price is prefilled from the listing. Monthly tax, insurance, HOA, maintenance, and utilities stay editable so you can test realistic ownership scenarios.</p>
          </div>
        </div>
      ) : null}

      <form
        className="mortgage-form-card card"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <div className="section-heading-row compact-heading-row">
          <div>
            <h3>Mortgage assumptions</h3>
            <p>Standard amortized mortgage formula with a proper zero-interest fallback.</p>
          </div>
          <div className="mortgage-form-actions">
            <button type="button" className="secondary-btn" onClick={onReset} disabled={loading}>Reset</button>
            <button type="submit" className="primary-btn" disabled={loading}>{loading ? 'Calculating...' : submitLabel}</button>
          </div>
        </div>

        <div className="affordability-form-grid mortgage-form-grid">
          <NumberInput
            label="Property price"
            value={form.propertyPrice}
            onChange={(value) => onFieldChange('propertyPrice', value)}
            helperText="Prefill is editable for scenario planning."
          />
          <NumberInput
            label="Down payment"
            value={form.downPayment}
            onChange={(value) => onFieldChange('downPayment', value)}
            helperText={`${downPaymentPercent.toLocaleString(undefined, { maximumFractionDigits: 2 })}% of the property price`}
          />
          <NumberInput
            label="Annual interest rate (%)"
            value={form.interestRate}
            onChange={(value) => onFieldChange('interestRate', value)}
            max="100"
          />
          <NumberInput
            label="Loan term (years)"
            value={form.loanTermYears}
            onChange={(value) => onFieldChange('loanTermYears', value)}
            step="1"
          />
        </div>

        <div className="mortgage-input-section">
          <div className="property-section-heading compact-mortgage-heading">
            <div>
              <h3>Recurring monthly ownership costs</h3>
              <p>These values are manual because the current property schema does not store numeric tax, insurance, or HOA figures safely.</p>
            </div>
          </div>
          <div className="affordability-form-grid mortgage-form-grid">
            {RECURRING_FIELDS.map((field) => (
              <NumberInput
                key={field.key}
                label={field.label}
                value={form.recurringCosts?.[field.key] || ''}
                onChange={(value) => onCostChange('recurringCosts', field.key, value)}
              />
            ))}
          </div>
        </div>

        <div className="mortgage-input-section">
          <div className="property-section-heading compact-mortgage-heading">
            <div>
              <h3>Optional one-time upfront costs</h3>
              <p>Helpful for demos when you want to show purchase cash needed beyond the down payment.</p>
            </div>
          </div>
          <div className="affordability-form-grid mortgage-form-grid">
            {ONE_TIME_FIELDS.map((field) => (
              <NumberInput
                key={field.key}
                label={field.label}
                value={form.oneTimeCosts?.[field.key] || ''}
                onChange={(value) => onCostChange('oneTimeCosts', field.key, value)}
              />
            ))}
          </div>
        </div>
      </form>
    </div>
  )
}
