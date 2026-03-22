function formatCurrency(value) {
  return `৳ ${Number(value || 0).toLocaleString()}`
}

function formatDate(value) {
  return new Date(value).toLocaleString()
}

export default function AffordabilityHistoryList({ history }) {
  return (
    <section className="card affordability-history-card">
      <div className="section-heading-row compact-heading-row">
        <div>
          <h3>Saved affordability history</h3>
          <p>Your latest 10 saved affordability snapshots.</p>
        </div>
      </div>

      {!history.length ? (
        <div className="empty-state compact-empty-state">
          <h3>No saved profiles yet</h3>
          <p>Save your affordability result to compare future changes.</p>
        </div>
      ) : (
        <div className="affordability-history-list">
          {history.map((item) => (
            <article key={item._id} className="affordability-history-item">
              <div>
                <strong>{formatCurrency(item.safeMonthlyRent)} / month</strong>
                <p>{formatCurrency(item.recommendedMinRent)} – {formatCurrency(item.recommendedMaxRent)}</p>
              </div>
              <div>
                <span>{formatDate(item.createdAt)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
