import { formatCurrency, formatPercent } from '../../lib/mortgage'

function Metric({ label, value, helper = '' }) {
  return (
    <article className="mortgage-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {helper ? <small>{helper}</small> : null}
    </article>
  )
}

export default function MortgageResultCard({ estimate }) {
  if (!estimate) return null

  return (
    <section className="card mortgage-result-card">
      <div className="section-heading-row compact-heading-row">
        <div>
          <h3>Financing summary</h3>
          <p>{estimate.property?.title ? `Based on ${estimate.property.title}` : 'Manual ownership scenario'}.</p>
        </div>
        <span className="affordability-status-chip">Ownership estimate</span>
      </div>

      <div className="mortgage-metric-grid">
        <Metric label="Loan amount" value={formatCurrency(estimate.summary.loanAmount)} helper={`${formatPercent(estimate.input.downPaymentPercent)} down payment`} />
        <Metric label="Monthly mortgage" value={formatCurrency(estimate.summary.monthlyMortgagePayment)} helper={`${estimate.input.loanTermMonths} monthly payments`} />
        <Metric label="Total monthly ownership cost" value={formatCurrency(estimate.summary.totalMonthlyOwnershipCost)} helper="Mortgage + recurring monthly costs" />
        <Metric label="Total repayment" value={formatCurrency(estimate.summary.totalRepayment)} helper="Mortgage principal + interest over the full term" />
        <Metric label="Total interest" value={formatCurrency(estimate.summary.totalInterest)} helper={`${formatPercent(estimate.input.annualInterestRate)} annual interest`} />
        <Metric label="Cash needed upfront" value={formatCurrency(estimate.summary.totalUpfrontCashNeeded)} helper="Down payment + one-time costs" />
      </div>
    </section>
  )
}
