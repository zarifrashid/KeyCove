function formatCurrency(value) {
  return `৳ ${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

export default function MortgageResultCard({ result, propertyLabel = '' }) {
  if (!result) {
    return (
      <section className="card mortgage-result-card">
        <h3>Mortgage summary</h3>
        <p>Run a calculation to see loan amount, monthly payment, total repayment, and interest breakdown.</p>
      </section>
    )
  }

  const { inputs, summary, assumptions } = result

  return (
    <section className="card mortgage-result-card">
      <div className="mortgage-result-header">
        <div>
          <h3>Mortgage summary</h3>
          <p>{propertyLabel || 'Based on your current calculator inputs.'}</p>
        </div>
        <span className="affordability-status-chip">{inputs.loanTermYears} year term</span>
      </div>

      <div className="mortgage-metric-grid">
        <div>
          <span>Loan amount</span>
          <strong>{formatCurrency(summary.loanAmount)}</strong>
        </div>
        <div>
          <span>Monthly mortgage</span>
          <strong>{formatCurrency(summary.monthlyPayment)}</strong>
        </div>
        <div>
          <span>Total repayment</span>
          <strong>{formatCurrency(summary.totalRepayment)}</strong>
        </div>
        <div>
          <span>Total interest</span>
          <strong>{formatCurrency(summary.totalInterest)}</strong>
        </div>
      </div>

      <div className="mortgage-detail-grid">
        <div><span>Listing price</span><strong>{formatCurrency(inputs.listingPrice)}</strong></div>
        <div><span>Down payment</span><strong>{formatCurrency(summary.downPaymentAmount)} ({inputs.downPaymentPercent}%)</strong></div>
        <div><span>Interest rate</span><strong>{inputs.interestRate}% annual</strong></div>
        <div><span>Monthly formula</span><strong>{assumptions.monthlyPaymentFormula}</strong></div>
      </div>
    </section>
  )
}
