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

      <div className="mortgage-payment-hero">
        <div>
          <span>Estimated monthly ownership</span>
          <strong>{formatCurrency(estimate.summary.totalMonthlyOwnershipCost)}</strong>
          <p>Mortgage payment plus monthly tax, insurance, service charge, maintenance, utilities, and other recurring costs.</p>
        </div>
        <div className="mortgage-payment-mini-grid">
          <article>
            <small>Mortgage</small>
            <b>{formatCurrency(estimate.summary.monthlyMortgagePayment)}</b>
          </article>
          <article>
            <small>Monthly extras</small>
            <b>{formatCurrency(estimate.summary.monthlyRecurringCosts)}</b>
          </article>
          <article>
            <small>Upfront cash</small>
            <b>{formatCurrency(estimate.summary.totalUpfrontCashNeeded)}</b>
          </article>
        </div>
      </div>

      <div className="mortgage-term-strip">
        <span>{formatPercent(estimate.input.downPaymentPercent)} down payment</span>
        <span>{formatPercent(estimate.input.annualInterestRate)} annual interest</span>
        <span>{estimate.input.loanTermYears} year term</span>
        <span>{estimate.input.loanTermMonths} payments</span>
      </div>

      <div className="mortgage-metric-grid">
        <Metric label="Loan amount" value={formatCurrency(estimate.summary.loanAmount)} helper={`${formatPercent(estimate.input.downPaymentPercent)} down payment`} />
        <Metric label="Monthly mortgage" value={formatCurrency(estimate.summary.monthlyMortgagePayment)} helper={`${estimate.input.loanTermMonths} monthly payments`} />
        <Metric label="Total repayment" value={formatCurrency(estimate.summary.totalRepayment)} helper="Mortgage principal + interest over the full term" />
        <Metric label="Total interest" value={formatCurrency(estimate.summary.totalInterest)} helper={`${formatPercent(estimate.input.annualInterestRate)} annual interest`} />
        <Metric label="Cash needed upfront" value={formatCurrency(estimate.summary.totalUpfrontCashNeeded)} helper="Down payment + one-time costs" />
      </div>
    </section>
  )
}
