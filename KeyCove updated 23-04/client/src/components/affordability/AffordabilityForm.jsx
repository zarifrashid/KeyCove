export default function AffordabilityForm({ values, onChange, onCalculate, onSave, loading }) {
  return (
    <section className="card affordability-form-card">
      <div className="section-heading-row">
        <div>
          <p className="badge">Affordability Analyzer</p>
          <h1>Find your safe monthly rent budget</h1>
          <p>Use a realistic, demo-friendly rule based on income, debt, and savings buffer.</p>
        </div>
      </div>

      <div className="affordability-form-grid">
        <label>
          <span>Monthly income</span>
          <input
            type="number"
            min="0"
            value={values.monthlyIncome}
            onChange={(event) => onChange('monthlyIncome', event.target.value)}
            placeholder="e.g. 50000"
          />
        </label>

        <label>
          <span>Monthly debt / fixed obligations</span>
          <input
            type="number"
            min="0"
            value={values.monthlyDebt}
            onChange={(event) => onChange('monthlyDebt', event.target.value)}
            placeholder="e.g. 8000"
          />
        </label>

        <label>
          <span>Monthly savings buffer</span>
          <input
            type="number"
            min="0"
            value={values.savingsBuffer}
            onChange={(event) => onChange('savingsBuffer', event.target.value)}
            placeholder="e.g. 5000"
          />
        </label>
      </div>

      <div className="hero-actions">
        <button type="button" className="primary-btn" onClick={onCalculate} disabled={loading}>
          {loading ? 'Calculating...' : 'Calculate affordability'}
        </button>
        <button type="button" className="secondary-btn" onClick={onSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save affordability profile'}
        </button>
      </div>
    </section>
  )
}
