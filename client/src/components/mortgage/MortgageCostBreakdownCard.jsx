import { formatCurrency } from '../../lib/mortgage'

function BreakdownList({ title, items, totalLabel, totalValue }) {
  return (
    <div className="mortgage-breakdown-panel">
      <div className="property-section-heading compact-mortgage-heading">
        <div>
          <h3>{title}</h3>
        </div>
      </div>
      <div className="mortgage-breakdown-list">
        {items.map((item) => (
          <div key={item.key} className="mortgage-breakdown-row">
            <span>{item.label}</span>
            <strong>{formatCurrency(item.value)}</strong>
          </div>
        ))}
        <div className="mortgage-breakdown-row total-row">
          <span>{totalLabel}</span>
          <strong>{formatCurrency(totalValue)}</strong>
        </div>
      </div>
    </div>
  )
}

export default function MortgageCostBreakdownCard({ estimate, compact = false }) {
  if (!estimate) return null

  return (
    <section className={`card mortgage-breakdown-card ${compact ? 'compact' : ''}`}>
      <div className="section-heading-row compact-heading-row">
        <div>
          <h3>Cost breakdown</h3>
          <p>Recurring costs are included in monthly ownership. One-time costs stay separate from the monthly total.</p>
        </div>
      </div>

      <div className="mortgage-breakdown-grid">
        <BreakdownList
          title="Monthly ownership cost"
          items={estimate.monthlyBreakdown}
          totalLabel="Total monthly ownership cost"
          totalValue={estimate.summary.totalMonthlyOwnershipCost}
        />
        <BreakdownList
          title="Upfront one-time costs"
          items={estimate.oneTimeBreakdown}
          totalLabel="Total upfront cash needed"
          totalValue={estimate.summary.totalUpfrontCashNeeded}
        />
      </div>

      <div className="mortgage-notes-box">
        <h4>How to explain this in a demo</h4>
        <ul>
          {estimate.notes.map((note) => <li key={note}>{note}</li>)}
        </ul>
      </div>
    </section>
  )
}
