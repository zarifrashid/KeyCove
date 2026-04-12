function formatMoney(value, suffix = '') {
  const numericValue = Number(value || 0)
  const amount = `৳ ${numericValue.toLocaleString()}`
  return suffix ? `${amount} ${suffix}` : amount
}

function resolvePrice(record) {
  const pricing = record?.pricing || {}
  const actionType = record?.actionType || ''

  if (actionType === 'buy') {
    return formatMoney(pricing.salePrice || pricing.totalCost)
  }

  if (actionType === 'lease') {
    return `${formatMoney(pricing.monthlyRent, '/ month')} • ${pricing.leaseMonths || 0} months`
  }

  return formatMoney(pricing.monthlyRent || pricing.totalCost, '/ month')
}

function TenantApplicationProfile({ record }) {
  const normalizedSnapshot =
    record?.tenantSnapshot ||
    record?.applicationDetails ||
    record?.applicationProfile ||
    {}

  const tenant = record?.tenant || {}

  if (!Object.keys(normalizedSnapshot).length && !tenant?.name && !tenant?.email) {
    return null
  }

  return (
    <div className="request-profile-panel">
      <h5>Application Details</h5>

      <div className="request-profile-grid">
        <p><strong>Name:</strong> {normalizedSnapshot.name || tenant.name || 'Not available'}</p>
        <p><strong>Email:</strong> {normalizedSnapshot.email || tenant.email || 'Not available'}</p>
        <p><strong>Phone:</strong> {normalizedSnapshot.phone || 'Not provided'}</p>
        <p><strong>Occupation:</strong> {normalizedSnapshot.occupation || 'Not provided'}</p>
        <p><strong>Employment Status:</strong> {normalizedSnapshot.employmentStatus || 'Not provided'}</p>
        <p>
          <strong>Monthly Income:</strong>{' '}
          {normalizedSnapshot.monthlyIncome ? formatMoney(normalizedSnapshot.monthlyIncome) : 'Not provided'}
        </p>
        <p><strong>Employer:</strong> {normalizedSnapshot.employerName || 'Not provided'}</p>
        <p><strong>Current Address:</strong> {normalizedSnapshot.currentAddress || 'Not provided'}</p>

        {normalizedSnapshot.additionalInfo ? (
          <p className="request-profile-grid-full">
            <strong>Additional Info:</strong> {normalizedSnapshot.additionalInfo}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default function TenantPropertyStatusSection({
  properties = [],
  loading,
  error,
  updatingId = '',
  onUpdateStatus
}) {
  return (
    <section className="card manager-dashboard-list-card request-section-card">
      <div className="manager-list-header">
        <div>
          <h3>Your Property Status</h3>
          <p>
            Approved rent, lease, and buy applications stay here so you can track which properties are
            currently active and which ones are in your previous history.
          </p>
        </div>
      </div>

      {error ? <p className="error-text manager-flash-text">{error}</p> : null}
      {loading ? (
        <div className="manager-empty-state">
          <h3>Loading approved properties...</h3>
        </div>
      ) : null}

      {!loading && !properties.length ? (
        <div className="manager-empty-state">
          <h3>No approved properties yet.</h3>
        </div>
      ) : null}

      {!loading && properties.length ? (
        <div className="request-list tenant-property-status-list">
          {properties.map((record) => {
            const isPrevious = record?.occupancyStatus === 'previous'

            return (
              <article
                key={record._id}
                className={`request-card tenant-status-card ${isPrevious ? 'tenant-status-card--previous' : ''}`}
              >
                <div className="request-card-topline">
                  <div>
                    <p className="badge">{(record?.actionType || 'request').toUpperCase()}</p>
                    <h4>{record?.property?.title || 'Property'}</h4>
                  </div>

                  <span className={`manager-status-badge ${isPrevious ? 'status-rejected' : 'status-approved'}`}>
                    {isPrevious ? 'previous' : 'active'}
                  </span>
                </div>

                <div className="request-card-grid">
                  <div>
                    <p><strong>Address:</strong> {record?.property?.location?.address || 'Not listed'}</p>
                    <p><strong>Area:</strong> {record?.property?.location?.area || 'Not listed'}</p>
                    <p><strong>Type:</strong> {record?.actionType || 'Not listed'}</p>
                  </div>

                  <div>
                    <p><strong>Pricing:</strong> {resolvePrice(record)}</p>
                    <p>
                      <strong>Approved:</strong>{' '}
                      {record?.reviewedAt ? new Date(record.reviewedAt).toLocaleString() : 'Approved'}
                    </p>
                    <p><strong>Manager:</strong> {record?.manager?.name || 'Manager'}</p>
                  </div>
                </div>

                <TenantApplicationProfile record={record} />

                <div className="tenant-property-status-controls">
                  <p className="tenant-property-status-question">Have you left your previous property?</p>

                  <div className="request-action-row">
                    <button
                      type="button"
                      className="secondary-btn"
                      disabled={updatingId === record._id || isPrevious}
                      onClick={() => onUpdateStatus?.(record._id, 'previous')}
                    >
                      {updatingId === record._id && !isPrevious ? 'Updating...' : 'Mark as Previous'}
                    </button>

                    <button
                      type="button"
                      className="primary-btn"
                      disabled={updatingId === record._id || !isPrevious}
                      onClick={() => onUpdateStatus?.(record._id, 'active')}
                    >
                      {updatingId === record._id && isPrevious ? 'Updating...' : 'Keep Active'}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}