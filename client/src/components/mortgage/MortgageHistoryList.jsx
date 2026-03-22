function formatCurrency(value) {
  return `৳ ${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

export default function MortgageHistoryList({ history, onLoad }) {
  return (
    <section className="card mortgage-history-card">
      <div className="section-heading-row compact-heading-row">
        <div>
          <h3>Saved mortgage scenarios</h3>
          <p>Recent saved calculations tied to your account.</p>
        </div>
      </div>

      {!history.length ? <p className="muted-text">No saved mortgage scenarios yet.</p> : null}

      <div className="affordability-history-list mortgage-history-list">
        {history.map((item) => (
          <button type="button" key={item.calculationId || item._id} className="affordability-history-item mortgage-history-item" onClick={() => onLoad(item)}>
            <div>
              <strong>{formatCurrency(item.listingPrice)}</strong>
              <p>{item.downPaymentPercent}% down • {item.loanTermYears} years • {item.interestRate}% interest</p>
            </div>
            <div>
                <strong>{formatCurrency(item.monthlyPayment)} / month</strong>
                <span style={{ display: 'block', marginTop: '6px' }}>
                  Saved on {new Date(item.createdAt).toLocaleString()}
                </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
