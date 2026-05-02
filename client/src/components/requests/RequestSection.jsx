import { Link } from 'react-router-dom'

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
        <p><strong>Phone:</strong> {normalizedSnapshot.phone || tenant?.phone || 'Not provided'}</p>
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

function SharedApplicationPanel({ request }) {
  const group = request?.groupSnapshot || {}
  const members = group.acceptedMembers || []
  const preferences = group.preferences || {}

  return (
    <div className="request-profile-panel shared-request-panel">
      <div className="shared-request-heading">
        <span className="badge">SHARED ROOMMATE APPLICATION</span>
        <p>This is a shared roommate application. Review all applicants before approving.</p>
      </div>
      <div className="request-profile-grid">
        <p><strong>Group Size:</strong> {members.length}/{group.targetGroupSize || members.length}</p>
        <p><strong>Rent Per Person:</strong> {formatMoney(group.rentPerPerson)}</p>
        <p><strong>Creator:</strong> {request.tenantSnapshot?.name || request.tenant?.name || 'Not available'}</p>
        <p><strong>Manager Message:</strong> {group.messageToManager || request.note || 'Not provided'}</p>
      </div>
      <div className="shared-member-list">
        {members.map((member, index) => (
          <article key={member.user || member.email || index} className="shared-member-card">
            <h5>{member.name || 'Roommate'}</h5>
            <p><strong>Email:</strong> {member.email || 'Manual / not registered'}</p>
            <p><strong>Phone:</strong> {member.phone || 'Not provided'}</p>
            <p><strong>Occupation:</strong> {member.occupation || 'Not provided'}</p>
            <p><strong>Status:</strong> {member.employmentStatus || 'Not provided'}</p>
            <p><strong>Contribution:</strong> {member.expectedContribution ? formatMoney(member.expectedContribution) : 'Not provided'}</p>
          </article>
        ))}
      </div>
      <div className="roommate-group-preferences">
        {Object.entries(preferences).map(([key, value]) => value ? <span key={key}>{key.replace(/([A-Z])/g, ' $1')}: {value}</span> : null)}
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
            const isSharedApplication = request?.applicationMode === 'roommate_group'
            const isLeaseEligible = isManager && request.status === 'approved' && ['rent', 'lease'].includes(request.actionType)

            return (
              <article key={request._id} className="request-card">
                <div className="request-card-topline">
                  <div>
                    <p className="badge">{isSharedApplication ? 'SHARED ROOMMATE APPLICATION' : (request.actionType || 'request').toUpperCase()}</p>
                    <h4>{request.property?.title || 'Property'}</h4>
                  </div>

                  <span className={`manager-status-badge status-${request.status || 'pending'}`}>
                    {request.status || 'pending'}
                  </span>
                </div>

                <div className="request-card-grid">
                  <div>
                    <p><strong>{isSharedApplication ? 'Primary Applicant' : 'Tenant'}:</strong> {normalizedSnapshot.name || request.tenant?.name || 'Not available'}</p>
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
                    {request.note ? <p><strong>Message:</strong> {request.note}</p> : null}
                  </div>
                </div>

                {isManager && isSharedApplication ? (
                  <SharedApplicationPanel request={request} />
                ) : null}

                {isManager && !isSharedApplication ? (
                  <TenantProfilePanel tenant={request.tenant} snapshot={normalizedSnapshot} />
                ) : null}

                {isLeaseEligible ? (
                  <div className="request-profile-panel request-profile-panel-inline-note">
                    <p>
                      This approved request is lease-ready. Create the actual lease record from{' '}
                      <Link to="/manager/leases">Lease Details</Link> so request history and lease management stay separate.
                    </p>
                  </div>
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
