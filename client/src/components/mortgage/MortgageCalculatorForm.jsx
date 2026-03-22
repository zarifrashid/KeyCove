function CurrencyInput({ label, name, value, onChange, disabled = false, step = '1000' }) {
  return (
    <label>
      <span>{label}</span>
      <input
        type="number"
        min="0"
        step={step}
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        disabled={disabled}
      />
    </label>
  )
}

export default function MortgageCalculatorForm({
  values,
  onChange,
  onCalculate,
  onReset,
  onSave,
  onExport,
  loading,
  saving,
  listingPriceLocked = false,
  showSave = true
}) {
  const estimatedDownPaymentAmount = Math.round(((Number(values.listingPrice || 0) * Number(values.downPaymentPercent || 0)) / 100) * 100) / 100

  return (
    <section className="card mortgage-form-card">
      <div className="section-heading-row compact-heading-row">
        <div>
          <h2>Mortgage &amp; cost calculator</h2>
          <p>Estimate financing burden, monthly ownership cost, and recurring housing expenses for sale listings.</p>
        </div>
        <span className="affordability-status-chip">Ownership only</span>
      </div>

      <div className="mortgage-form-grid">
        <CurrencyInput
          label="Listing price"
          name="listingPrice"
          value={values.listingPrice}
          onChange={onChange}
          disabled={listingPriceLocked}
        />
        <label>
          <span>Down payment %</span>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            name="downPaymentPercent"
            value={values.downPaymentPercent}
            onChange={(event) => onChange('downPaymentPercent', event.target.value)}
          />
        </label>
        <label>
          <span>Loan term (years)</span>
          <input
            type="number"
            min="1"
            step="1"
            name="loanTermYears"
            value={values.loanTermYears}
            onChange={(event) => onChange('loanTermYears', event.target.value)}
          />
        </label>
        <label>
          <span>Interest rate (%)</span>
          <input
            type="number"
            min="0"
            step="0.1"
            name="interestRate"
            value={values.interestRate}
            onChange={(event) => onChange('interestRate', event.target.value)}
          />
        </label>
        <CurrencyInput label="Estimated monthly property tax" name="estimatedTax" value={values.estimatedTax} onChange={onChange} />
        <CurrencyInput label="Estimated monthly insurance" name="estimatedInsurance" value={values.estimatedInsurance} onChange={onChange} />
        <CurrencyInput label="Estimated monthly utilities" name="estimatedUtilities" value={values.estimatedUtilities} onChange={onChange} />
        <CurrencyInput label="Monthly HOA / service charge" name="hoaFee" value={values.hoaFee} onChange={onChange} />
      </div>

      <div className="mortgage-inline-summary">
        <div>
          <span>Estimated down payment</span>
          <strong>৳ {estimatedDownPaymentAmount.toLocaleString()}</strong>
        </div>
        <div>
          <span>Listing context</span>
          <strong>{listingPriceLocked ? 'Property-linked' : 'Manual scenario'}</strong>
        </div>
      </div>

      <div className="hero-actions mortgage-actions-row">
        <button type="button" className="primary-btn" onClick={onCalculate} disabled={loading}>
          {loading ? 'Calculating...' : 'Calculate'}
        </button>
        <button type="button" className="secondary-btn" onClick={onReset} disabled={loading || saving}>
          Reset
        </button>
        {showSave ? (
          <button type="button" className="secondary-btn" onClick={onSave} disabled={loading || saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        ) : null}
        <button type="button" className="secondary-btn" onClick={onExport} disabled={loading}>
          Export
        </button>
      </div>
    </section>
  )
}
