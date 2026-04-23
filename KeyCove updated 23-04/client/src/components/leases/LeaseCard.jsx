import { Link } from 'react-router-dom'

function formatMoney(value, suffix = '') {
  const amount = `৳ ${Number(value || 0).toLocaleString()}`
  return suffix ? `${amount} ${suffix}` : amount
}

function formatDate(value) {
  if (!value) return 'Not available'
  return new Date(value).toLocaleDateString()
}

export default function LeaseCard({
  lease,
  viewerRole = 'tenant',
  onStatusChange,
  statusUpdatingId = ''
}) {
  const isManager = viewerRole === 'manager'
  const contact = isManager ? lease?.tenant : lease?.manager
  const isUpdating = statusUpdatingId === lease?._id

  return (
    <article className="request-card lease-card">
      <div className="request-card-topline lease-card-topline">
        <div>
          <p className="badge">{isManager ? 'Managed Lease' : 'My Lease'}</p>
          <h4>{lease?.property?.title || 'Property'}</h4>
          <p className="lease-card-address">
            {lease?.property?.location?.address || 'Address not listed'}
            {lease?.property?.location?.area ? `, ${lease.property.location.area}` : ''}
          </p>
        </div>

        <span className={`manager-status-badge status-${lease?.status || 'pending'}`}>
          {lease?.status || 'pending'}
        </span>
      </div>

      <div className="lease-card-body">
        <div className="lease-card-image-wrap">
          <img
            src={lease?.property?.image || 'https://via.placeholder.com/640x420?text=Residence'}
            alt={lease?.property?.title || 'Residence'}
            className="lease-card-image"
          />
        </div>

        <div className="lease-card-grid">
          <div>
            <h5>Lease Information</h5>
            <p><strong>Start Date:</strong> {formatDate(lease?.startDate)}</p>
            <p><strong>End Date:</strong> {formatDate(lease?.endDate)}</p>
            <p><strong>Monthly Rent:</strong> {formatMoney(lease?.monthlyRent, '/ month')}</p>
            <p><strong>Created:</strong> {formatDate(lease?.createdAt)}</p>
            {lease?.notes ? <p><strong>Notes:</strong> {lease.notes}</p> : null}
          </div>

          <div>
            <h5>{isManager ? 'Tenant Information' : 'Manager Information'}</h5>
            <p><strong>Name:</strong> {contact?.fullName || 'Not provided'}</p>
            <p><strong>Email:</strong> {contact?.email || 'Not provided'}</p>
            <p><strong>Phone:</strong> {contact?.phone || 'Not provided'}</p>
            {isManager ? (
              <>
                <p><strong>Occupation:</strong> {contact?.occupation || 'Not provided'}</p>
                <p><strong>Employment Status:</strong> {contact?.employmentStatus || 'Not provided'}</p>
              </>
            ) : (
              <>
                <p><strong>Role:</strong> {contact?.role || 'manager'}</p>
                <p><strong>Company:</strong> {contact?.companyName || 'Not provided'}</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="request-action-row lease-card-actions">
        <Link to={`/leases/${lease?._id}`} className="primary-btn">View Lease</Link>
        <Link to={`/properties/${lease?.property?._id}`} className="secondary-btn">Residence Details</Link>

        {isManager ? (
          <>
            {lease?.status !== 'active' ? (
              <button
                type="button"
                className="secondary-btn"
                disabled={isUpdating}
                onClick={() => onStatusChange?.(lease?._id, 'active')}
              >
                {isUpdating ? 'Updating...' : 'Set Active'}
              </button>
            ) : null}

            {lease?.status !== 'expired' ? (
              <button
                type="button"
                className="secondary-btn"
                disabled={isUpdating}
                onClick={() => onStatusChange?.(lease?._id, 'expired')}
              >
                {isUpdating ? 'Updating...' : 'Mark Expired'}
              </button>
            ) : null}

            {lease?.status !== 'terminated' ? (
              <button
                type="button"
                className="secondary-btn"
                disabled={isUpdating}
                onClick={() => onStatusChange?.(lease?._id, 'terminated')}
              >
                {isUpdating ? 'Updating...' : 'Terminate Lease'}
              </button>
            ) : null}
          </>
        ) : null}
      </div>
    </article>
  )
}
