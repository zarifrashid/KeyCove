import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

function formatMoney(value, suffix = '') {
  const amount = `৳ ${Number(value || 0).toLocaleString()}`
  return suffix ? `${amount} ${suffix}` : amount
}

function formatDate(value, withTime = false) {
  if (!value) return 'Not available'
  const date = new Date(value)
  return withTime ? date.toLocaleString() : date.toLocaleDateString()
}

function InfoGrid({ title, rows = [] }) {
  return (
    <section className="card lease-detail-section">
      <h3>{title}</h3>
      <div className="request-profile-grid">
        {rows.map((row) => (
          <p key={row.label} className={row.fullWidth ? 'request-profile-grid-full' : ''}>
            <strong>{row.label}:</strong> {row.value || 'Not provided'}
          </p>
        ))}
      </div>
    </section>
  )
}

export default function LeaseDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [state, setState] = useState({ loading: true, error: '', lease: null })

  useEffect(() => {
    const fetchLease = async () => {
      try {
        setState((previous) => ({ ...previous, loading: true, error: '' }))
        const { data } = await api.get(`/leases/${id}`)
        setState({ loading: false, error: '', lease: data.lease || null })
      } catch (error) {
        setState({
          loading: false,
          error: error.response?.data?.message || 'Failed to load lease details.',
          lease: null
        })
      }
    }

    if (id) fetchLease()
  }, [id])

  const lease = state.lease
  const isManager = user?.role === 'manager'
  const backPath = isManager ? '/manager/leases' : '/my-leases'

  return (
    <>
      <Navbar />
      <div className="page-wrap dashboard-stack lease-page-wrap">
        {state.loading ? (
          <section className="card lease-detail-hero">
            <h2>Loading lease details...</h2>
          </section>
        ) : null}

        {state.error ? <p className="error-text manager-flash-text">{state.error}</p> : null}

        {lease && !state.loading ? (
          <>
            <section className="card lease-detail-hero">
              <p className="badge">Lease Record</p>
              <h1>{lease.property?.title || 'Lease Details'}</h1>
              <p>
                Review the lease timeline, residence information, and the linked {isManager ? 'tenant' : 'manager'} details.
              </p>
              <div className="request-action-row" style={{ marginTop: '16px' }}>
                <Link to={`/properties/${lease.property?._id}`} className="primary-btn">Residence Details</Link>
                <button type="button" className="secondary-btn" onClick={() => navigate(backPath)}>
                  Back
                </button>
              </div>
            </section>

            <InfoGrid
              title="Lease Information"
              rows={[
                { label: 'Start Date', value: formatDate(lease.startDate) },
                { label: 'End Date', value: formatDate(lease.endDate) },
                { label: 'Monthly Rent', value: formatMoney(lease.monthlyRent, '/ month') },
                { label: 'Status', value: lease.status },
                { label: 'Created At', value: formatDate(lease.createdAt, true) },
                { label: 'Notes', value: lease.notes || 'No notes added', fullWidth: true }
              ]}
            />

            <section className="card lease-detail-section">
              <h3>Property Information</h3>
              <div className="lease-detail-property-layout">
                <img
                  src={lease.property?.image || 'https://via.placeholder.com/720x420?text=Residence'}
                  alt={lease.property?.title || 'Residence'}
                  className="lease-detail-property-image"
                />
                <div className="request-profile-grid">
                  <p><strong>Title:</strong> {lease.property?.title || 'Not available'}</p>
                  <p><strong>Address:</strong> {lease.property?.location?.address || 'Not available'}</p>
                  <p><strong>Area:</strong> {lease.property?.location?.area || 'Not available'}</p>
                  <p><strong>City:</strong> {lease.property?.location?.city || 'Dhaka'}</p>
                  <p><strong>Property Type:</strong> {lease.property?.propertyType || 'Not available'}</p>
                  <p><strong>Bedrooms / Bathrooms:</strong> {lease.property?.bedrooms || 0} / {lease.property?.bathrooms || 0}</p>
                </div>
              </div>
            </section>

            {isManager ? (
              <InfoGrid
                title="Tenant Information"
                rows={[
                  { label: 'Full Name', value: lease.tenant?.fullName },
                  { label: 'Email', value: lease.tenant?.email },
                  { label: 'Phone', value: lease.tenant?.phone },
                  { label: 'Occupation', value: lease.tenant?.occupation },
                  { label: 'Employment Status', value: lease.tenant?.employmentStatus },
                  { label: 'Monthly Income', value: lease.tenant?.monthlyIncome ? formatMoney(lease.tenant.monthlyIncome) : 'Not provided' },
                  { label: 'Employer', value: lease.tenant?.employerName },
                  { label: 'Current Address', value: lease.tenant?.currentAddress },
                  { label: 'Additional Info', value: lease.tenant?.additionalInfo || 'Not provided', fullWidth: true }
                ]}
              />
            ) : (
              <InfoGrid
                title="Manager Information"
                rows={[
                  { label: 'Full Name', value: lease.manager?.fullName },
                  { label: 'Email', value: lease.manager?.email },
                  { label: 'Phone', value: lease.manager?.phone },
                  { label: 'Role', value: lease.manager?.role },
                  { label: 'Company Name', value: lease.manager?.companyName || 'Not provided' },
                  { label: 'Current Address', value: lease.manager?.currentAddress || 'Not provided' },
                  { label: 'Additional Info', value: lease.manager?.additionalInfo || 'Not provided', fullWidth: true }
                ]}
              />
            )}
          </>
        ) : null}
      </div>
    </>
  )
}
