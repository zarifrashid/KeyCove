import { Link } from 'react-router-dom'
import useMortgageCalculator from '../../hooks/useMortgageCalculator'
import MortgageCalculatorForm from './MortgageCalculatorForm'
import MortgageResultCard from './MortgageResultCard'
import MortgageCostBreakdownCard from './MortgageCostBreakdownCard'

export default function PropertyMortgageWidget({ property }) {
  const { form, result, status, updateField, updateCostField, calculate, reset } = useMortgageCalculator({
    property,
    autoCalculate: true
  })

  return (
    <div className="mortgage-widget-stack">
      <div className="mortgage-relationship-note">
        <h3>Ownership cost estimator</h3>
        <p>
          This tool is for buying a property. KeyCove&apos;s Affordability Analyzer still answers a different question: how much monthly rent is safely manageable.
        </p>
        <Link to={`/mortgage-calculator?propertyId=${property._id}`} className="secondary-btn">Open full calculator page</Link>
      </div>

      <MortgageCalculatorForm
        form={form}
        onFieldChange={updateField}
        onCostChange={updateCostField}
        onSubmit={calculate}
        onReset={reset}
        loading={status.loading}
        submitLabel={result ? 'Update estimate' : 'Calculate ownership cost'}
        showContext
        contextTitle={property?.title ? `${property.title} · sale listing` : 'Sale listing estimate'}
      />

      {status.error ? <p className="error-text">{status.error}</p> : null}
      <MortgageResultCard estimate={result} />
      <MortgageCostBreakdownCard estimate={result} compact />
    </div>
  )
}
