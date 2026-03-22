function formatCurrency(value) {
  return `৳ ${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

export default function CostBreakdownCard({ result }) {
  if (!result) {
    return (
      <section className="card mortgage-breakdown-card">
        <h3>Total ownership cost</h3>
        <p>Recurring ownership costs will appear here after you calculate a scenario.</p>
      </section>
    )
  }

  const { inputs, summary, assumptions } = result

  return (
    <section className="card mortgage-breakdown-card">
      <div className="mortgage-result-header">
        <div>
          <h3>Total ownership cost</h3>
          <p>Monthly ownership burden including mortgage and recurring housing costs.</p>
        </div>
        <strong className="mortgage-total-highlight">{formatCurrency(summary.totalMonthlyOwnershipCost)} / month</strong>
      </div>

      <div className="mortgage-breakdown-list">
        <div><span>Monthly mortgage</span><strong>{formatCurrency(summary.monthlyPayment)}</strong></div>
        <div><span>Property tax</span><strong>{formatCurrency(inputs.estimatedTax)}</strong></div>
        <div><span>Insurance</span><strong>{formatCurrency(inputs.estimatedInsurance)}</strong></div>
        <div><span>Utilities</span><strong>{formatCurrency(inputs.estimatedUtilities)}</strong></div>
        <div><span>HOA / service charge</span><strong>{formatCurrency(inputs.hoaFee)}</strong></div>
        <div><span>Total monthly ownership cost</span><strong>{formatCurrency(summary.totalMonthlyOwnershipCost)}</strong></div>
      </div>

      <div className="affordability-explainer-box">
        <strong>Transparent assumptions</strong>
        <p>{assumptions.ownershipCostFormula}</p>
      </div>
    </section>
  )
}
