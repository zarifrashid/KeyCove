import { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import LeaseCard from '../components/leases/LeaseCard'
import { api } from '../lib/api'

const FILTERS = ['all', 'active', 'pending', 'expired', 'terminated']

function toInputDate(value) {
  if (!value) return ''
  return new Date(value).toISOString().slice(0, 10)
}

function addMonthsToDate(value, months = 12) {
  const next = new Date(value)
  next.setMonth(next.getMonth() + Number(months || 0))
  return next
}

function formatMoney(value, suffix = '') {
  const amount = `৳ ${Number(value || 0).toLocaleString()}`
  return suffix ? `${amount} ${suffix}` : amount
}

export default function ManagerLeasesPage() {
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [state, setState] = useState({
    loading: true,
    submitting: false,
    statusUpdatingId: '',
    error: '',
    flash: '',
    leases: [],
    requests: [],
    properties: []
  })
  const [form, setForm] = useState({
    sourceRequestId: '',
    propertyId: '',
    tenantId: '',
    startDate: toInputDate(new Date()),
    endDate: toInputDate(addMonthsToDate(new Date(), 12)),
    monthlyRent: '',
    status: 'active',
    notes: ''
  })

  const fetchPageData = async (filterValue = selectedFilter) => {
    try {
      setState((previous) => ({ ...previous, loading: true, error: '' }))

      const leaseEndpoint = filterValue === 'all'
        ? '/leases/manager'
        : `/leases/manager?status=${filterValue}`

      const [{ data: leaseData }, { data: requestData }, { data: propertyData }] = await Promise.all([
        api.get(leaseEndpoint),
        api.get('/property-requests/manager'),
        api.get('/properties/mine')
      ])

      setState((previous) => ({
        ...previous,
        loading: false,
        leases: leaseData.leases || [],
        requests: requestData.requests || [],
        properties: propertyData.properties || []
      }))
    } catch (error) {
      setState((previous) => ({
        ...previous,
        loading: false,
        error: error.response?.data?.message || 'Failed to load lease management data.'
      }))
    }
  }

  useEffect(() => {
    fetchPageData(selectedFilter)
  }, [selectedFilter])

  const leaseRequestIds = useMemo(
    () => new Set(state.leases.map((lease) => lease?.sourceRequest?._id).filter(Boolean)),
    [state.leases]
  )

  const readyRequests = useMemo(
    () => state.requests.filter((request) => {
      return request.status === 'approved' && ['rent', 'lease'].includes(request.actionType) && !leaseRequestIds.has(request._id)
    }),
    [leaseRequestIds, state.requests]
  )

  const tenantOptions = useMemo(() => {
    const seen = new Map()

    state.requests.forEach((request) => {
      if (!request?.tenant?._id) return
      if (!seen.has(request.tenant._id)) {
        seen.set(request.tenant._id, {
          _id: request.tenant._id,
          name: request.tenantSnapshot?.name || request.tenant?.name || 'Tenant',
          email: request.tenantSnapshot?.email || request.tenant?.email || '',
          phone: request.tenantSnapshot?.phone || request.tenant?.phone || ''
        })
      }
    })

    return Array.from(seen.values())
  }, [state.requests])

  const applyReadyRequest = (request) => {
    const today = new Date()
    const leaseMonths = Number(request?.pricing?.leaseMonths || 12) || 12

    setForm({
      sourceRequestId: request?._id || '',
      propertyId: request?.property?._id || '',
      tenantId: request?.tenant?._id || '',
      startDate: toInputDate(today),
      endDate: toInputDate(addMonthsToDate(today, leaseMonths)),
      monthlyRent: String(request?.pricing?.monthlyRent || ''),
      status: 'active',
      notes: request?.note || ''
    })

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFormChange = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  const resetForm = () => {
    setForm({
      sourceRequestId: '',
      propertyId: '',
      tenantId: '',
      startDate: toInputDate(new Date()),
      endDate: toInputDate(addMonthsToDate(new Date(), 12)),
      monthlyRent: '',
      status: 'active',
      notes: ''
    })
  }

  const handleCreateLease = async (event) => {
    event.preventDefault()

    try {
      setState((previous) => ({ ...previous, submitting: true, error: '', flash: '' }))

      const payload = {
        propertyId: form.propertyId,
        tenantId: form.tenantId,
        startDate: form.startDate,
        endDate: form.endDate,
        monthlyRent: Number(form.monthlyRent),
        status: form.status,
        notes: form.notes
      }

      if (form.sourceRequestId) {
        await api.post(`/leases/from-request/${form.sourceRequestId}`, payload)
      } else {
        await api.post('/leases', {
          ...payload,
          sourceRequest: null
        })
      }

      resetForm()
      setState((previous) => ({
        ...previous,
        submitting: false,
        flash: 'Lease created successfully.'
      }))
      await fetchPageData(selectedFilter)
    } catch (error) {
      setState((previous) => ({
        ...previous,
        submitting: false,
        error: error.response?.data?.message || 'Failed to create lease.'
      }))
    }
  }

  const handleStatusChange = async (leaseId, status) => {
    try {
      setState((previous) => ({ ...previous, statusUpdatingId: leaseId, error: '', flash: '' }))
      const { data } = await api.patch(`/leases/${leaseId}/status`, { status })
      setState((previous) => ({
        ...previous,
        statusUpdatingId: '',
        flash: data.message || `Lease updated to ${status}.`,
        leases: previous.leases.map((lease) => (lease._id === leaseId ? data.lease : lease))
      }))
    } catch (error) {
      setState((previous) => ({
        ...previous,
        statusUpdatingId: '',
        error: error.response?.data?.message || 'Failed to update lease status.'
      }))
    }
  }

  const usingApprovedRequest = Boolean(form.sourceRequestId)

  return (
    <>
      <Navbar />
      <div className="page-wrap dashboard-stack lease-page-wrap">
        <section className="card manager-dashboard-hero lease-hero-card">
          <p className="badge">Feature 18</p>
          <h1>Lease Details</h1>
          <p>
            Manage post-approval rental and lease records from one dedicated module. Approved rent and lease
            requests can be turned into active lease records here without mixing them into request history.
          </p>
        </section>

        {state.flash ? <p className="success-text manager-flash-text">{state.flash}</p> : null}
        {state.error ? <p className="error-text manager-flash-text">{state.error}</p> : null}

        <section className="card lease-form-card">
          <div className="manager-list-header">
            <div>
              <h3>Create Lease</h3>
              <p>Create from an approved request or enter a lease manually for one of your properties.</p>
            </div>
          </div>

          <form className="lease-setup-form" onSubmit={handleCreateLease}>
            <label className="property-field full-width">
              <span>Approved Request (Optional)</span>
              <select
                value={form.sourceRequestId}
                onChange={(event) => {
                  const matchedRequest = readyRequests.find((request) => request._id === event.target.value)
                  if (matchedRequest) {
                    applyReadyRequest(matchedRequest)
                  } else {
                    handleFormChange('sourceRequestId', '')
                  }
                }}
              >
                <option value="">Create manually</option>
                {readyRequests.map((request) => (
                  <option key={request._id} value={request._id}>
                    {request.property?.title || 'Property'} - {request.tenantSnapshot?.name || request.tenant?.name || 'Tenant'}
                  </option>
                ))}
              </select>
            </label>

            <div className="property-action-grid">
              <label className="property-field">
                <span>Property</span>
                <select
                  value={form.propertyId}
                  disabled={usingApprovedRequest}
                  onChange={(event) => handleFormChange('propertyId', event.target.value)}
                  required
                >
                  <option value="">Select property</option>
                  {state.properties.map((property) => (
                    <option key={property._id} value={property._id}>{property.title}</option>
                  ))}
                </select>
              </label>

              <label className="property-field">
                <span>Tenant</span>
                <select
                  value={form.tenantId}
                  disabled={usingApprovedRequest}
                  onChange={(event) => handleFormChange('tenantId', event.target.value)}
                  required
                >
                  <option value="">Select tenant</option>
                  {tenantOptions.map((tenant) => (
                    <option key={tenant._id} value={tenant._id}>
                      {tenant.name} {tenant.email ? `(${tenant.email})` : ''}
                    </option>
                  ))}
                </select>
              </label>

              <label className="property-field">
                <span>Monthly Rent</span>
                <input
                  type="number"
                  min="0"
                  value={form.monthlyRent}
                  onChange={(event) => handleFormChange('monthlyRent', event.target.value)}
                  required
                />
              </label>

              <label className="property-field">
                <span>Start Date</span>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(event) => handleFormChange('startDate', event.target.value)}
                  required
                />
              </label>

              <label className="property-field">
                <span>End Date</span>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(event) => handleFormChange('endDate', event.target.value)}
                  required
                />
              </label>

              <label className="property-field">
                <span>Status</span>
                <select value={form.status} onChange={(event) => handleFormChange('status', event.target.value)}>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="expired">Expired</option>
                  <option value="terminated">Terminated</option>
                </select>
              </label>
            </div>

            <label className="property-field full-width">
              <span>Notes</span>
              <textarea
                rows="4"
                value={form.notes}
                onChange={(event) => handleFormChange('notes', event.target.value)}
                placeholder="Add lease notes or special terms"
              />
            </label>

            <div className="request-action-row">
              <button type="submit" className="primary-btn" disabled={state.submitting}>
                {state.submitting ? 'Saving...' : 'Create Lease'}
              </button>
              <button type="button" className="secondary-btn" onClick={resetForm} disabled={state.submitting}>
                Clear Form
              </button>
            </div>
          </form>
        </section>

        <section className="card manager-dashboard-list-card">
          <div className="manager-list-header">
            <div>
              <h3>Approved Requests Ready for Lease</h3>
              <p>Only approved rent and lease requests appear here. Buy requests are excluded automatically.</p>
            </div>
          </div>

          {!readyRequests.length ? (
            <div className="manager-empty-state">
              <h3>No approved rent or lease requests are waiting for lease creation.</h3>
            </div>
          ) : (
            <div className="lease-ready-grid">
              {readyRequests.map((request) => (
                <article key={request._id} className="request-card lease-ready-card">
                  <div className="request-card-topline">
                    <div>
                      <p className="badge">{request.actionType?.toUpperCase() || 'REQUEST'}</p>
                      <h4>{request.property?.title || 'Property'}</h4>
                    </div>
                    <span className="manager-status-badge status-approved">approved</span>
                  </div>

                  <div className="request-card-grid">
                    <div>
                      <p><strong>Tenant:</strong> {request.tenantSnapshot?.name || request.tenant?.name || 'Tenant'}</p>
                      <p><strong>Email:</strong> {request.tenantSnapshot?.email || request.tenant?.email || 'Not provided'}</p>
                      <p><strong>Phone:</strong> {request.tenantSnapshot?.phone || request.tenant?.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <p><strong>Area:</strong> {request.property?.location?.area || 'Not listed'}</p>
                      <p><strong>Address:</strong> {request.property?.location?.address || 'Not listed'}</p>
                      <p><strong>Monthly Rent:</strong> {formatMoney(request.pricing?.monthlyRent, '/ month')}</p>
                    </div>
                  </div>

                  <div className="request-action-row">
                    <button type="button" className="primary-btn" onClick={() => applyReadyRequest(request)}>
                      Create Lease
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="card manager-dashboard-list-card">
          <div className="manager-list-header lease-filter-header">
            <div>
              <h3>Managed Lease Records</h3>
              <p>Filter by status and open each record for complete lease, property, and tenant details.</p>
            </div>
            <div className="lease-filter-tabs">
              {FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={`secondary-btn ${selectedFilter === filter ? 'secondary-btn-active' : ''}`}
                  onClick={() => setSelectedFilter(filter)}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {state.loading ? (
            <div className="manager-empty-state">
              <h3>Loading lease records...</h3>
            </div>
          ) : !state.leases.length ? (
            <div className="manager-empty-state">
              <h3>No lease records found for the selected filter.</h3>
            </div>
          ) : (
            <div className="request-list">
              {state.leases.map((lease) => (
                <LeaseCard
                  key={lease._id}
                  lease={lease}
                  viewerRole="manager"
                  onStatusChange={handleStatusChange}
                  statusUpdatingId={state.statusUpdatingId}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
