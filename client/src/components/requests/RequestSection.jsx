function formatMoney(value, suffix = '') {
  const numericValue = Number(value || 0)
  const amount = `৳ ${numericValue.toLocaleString()}`
  return suffix ? `${amount} ${suffix}` : amount
}

function RequestMeta({ request }) {
  const pricing = request?.pricing || {}
  const actionType = request?.actionType || ''

  if (actionType === 'buy') {
    return (
      <p>
        <strong>Sale Price:</strong> {formatMoney(pricing.salePrice || pricing.totalCost)}
      </p>
    )
  }

  if (actionType === 'lease') {
    return (
      <>
        <p>
          <strong>Monthly Rent:</strong> {formatMoney(pricing.monthlyRent, '/ month')}
        </p>
        <p>
          <strong>Lease Months:</strong> {pricing.leaseMonths || 0}
        </p>
        <p>
          <strong>Total Cost:</strong> {formatMoney(pricing.totalCost)}
        </p>
      </>
    )
  }

  return (
    <p>
      <strong>Monthly Rent:</strong> {formatMoney(pricing.monthlyRent || pricing.totalCost, '/ month')}
    </p>
  )
}

function TenantProfilePanel({ tenant, snapshot }) {
  const normalizedSnapshot = snapshot || {}

  return (
    <div className="request-profile-panel">
      <h5>Tenant Profile</h5>

      <div className="request-profile-grid">
        <p><strong>Name:</strong> {normalizedSnapshot.name || tenant?.name || 'Not available'}</p>
        <p><strong>Email:</strong> {normalizedSnapshot.email || tenant?.email || 'Not available'}</p>
        <p><strong>Phone:</strong> {normalizedSnapshot.phone || 'Not provided'}</p>
        <p><strong>Role:</strong> {tenant?.role || 'tenant'}</p>
        <p><strong>Occupation:</strong> {normalizedSnapshot.occupation || 'Not provided'}</p>
        <p><strong>Employment Status:</strong> {normalizedSnapshot.employmentStatus || 'Not provided'}</p>
        <p>
          <strong>Monthly Income:</strong>{' '}
          {normalizedSnapshot.monthlyIncome ? formatMoney(normalizedSnapshot.monthlyIncome) : 'Not provided'}
        </p>
        <p><strong>Employer:</strong> {normalizedSnapshot.employerName || 'Not provided'}</p>
        <p><strong>Current Address:</strong> {normalizedSnapshot.currentAddress || 'Not provided'}</p>
        <p>
          <strong>Joined:</strong>{' '}
          {tenant?.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : 'Not available'}
        </p>

        {normalizedSnapshot.additionalInfo ? (
          <p className="request-profile-grid-full">
            <strong>Additional Info:</strong> {normalizedSnapshot.additionalInfo}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default function RequestSection({
  title,
  subtitle,
  requests = [],
  loading,
  error,
  emptyText,
  isManager = false,
  onReview,
  reviewingId = ''
}) {
  return (
    <section className="card manager-dashboard-list-card request-section-card">
      <div className="manager-list-header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>

      {error ? <p className="error-text manager-flash-text">{error}</p> : null}
      {loading ? <div className="manager-empty-state"><h3>Loading requests...</h3></div> : null}

      {!loading && !requests.length ? (
        <div className="manager-empty-state">
          <h3>{emptyText}</h3>
        </div>
      ) : null}

      {!loading && requests.length ? (
        <div className="request-list">
          {requests.map((request) => {
            const normalizedSnapshot = request?.tenantSnapshot || request?.applicationDetails || {}

            return (
              <article key={request._id} className="request-card">
                <div className="request-card-topline">
                  <div>
                    <p className="badge">{(request.actionType || 'request').toUpperCase()}</p>
                    <h4>{request.property?.title || 'Property'}</h4>
                  </div>

                  <span className={`manager-status-badge status-${request.status || 'pending'}`}>
                    {request.status || 'pending'}
                  </span>
                </div>

                <div className="request-card-grid">
                  <div>
                    <p><strong>Tenant:</strong> {normalizedSnapshot.name || request.tenant?.name || 'Not available'}</p>
                    <p><strong>Email:</strong> {normalizedSnapshot.email || request.tenant?.email || 'Not available'}</p>
                    <RequestMeta request={request} />
                  </div>

                  <div>
                    <p><strong>Address:</strong> {request.property?.location?.address || 'Not listed'}</p>
                    <p><strong>Area:</strong> {request.property?.location?.area || 'Not listed'}</p>
                    <p><strong>Submitted:</strong> {request.createdAt ? new Date(request.createdAt).toLocaleString() : 'Not available'}</p>
                    {request.reviewedAt ? (
                      <p><strong>Reviewed:</strong> {new Date(request.reviewedAt).toLocaleString()}</p>
                    ) : null}
                    {request.note ? <p><strong>Note:</strong> {request.note}</p> : null}
                  </div>
                </div>

                {isManager ? (
                  <TenantProfilePanel tenant={request.tenant} snapshot={normalizedSnapshot} />
                ) : null}

                {isManager && request.status === 'pending' ? (
                  <div className="request-action-row">
                    <button
                      type="button"
                      className="primary-btn"
                      disabled={reviewingId === request._id}
                      onClick={() => onReview?.(request._id, 'approved')}
                    >
                      {reviewingId === request._id ? 'Updating...' : 'Approve'}
                    </button>

                    <button
                      type="button"
                      className="secondary-btn"
                      disabled={reviewingId === request._id}
                      onClick={() => onReview?.(request._id, 'rejected')}
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}