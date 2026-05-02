import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { api } from '../lib/api'

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'replied', label: 'Replied' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' }
]

const REASON_FILTERS = [
  { value: '', label: 'All reasons' },
  { value: 'fake_listing', label: 'Fake listing' },
  { value: 'wrong_rent', label: 'Wrong rent' },
  { value: 'wrong_location', label: 'Wrong location' },
  { value: 'wrong_property_information', label: 'Wrong property information' },
  { value: 'misleading_photos', label: 'Misleading photos' },
  { value: 'property_already_rented', label: 'Property already rented' },
  { value: 'duplicate_listing', label: 'Duplicate listing' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'suspicious_manager', label: 'Suspicious manager' },
  { value: 'other', label: 'Other' }
]

const REASON_LABELS = Object.fromEntries(REASON_FILTERS.filter((item) => item.value).map((item) => [item.value, item.label]))

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

function reasonLabel(reason) {
  return REASON_LABELS[reason] || reason || '-'
}

export default function AdminPropertyReportsPage() {
  const [reports, setReports] = useState([])
  const [filters, setFilters] = useState({ status: '', reason: '', search: '' })
  const [state, setState] = useState({ loading: true, error: '' })

  const loadReports = async () => {
    try {
      setState({ loading: true, error: '' })
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.reason) params.set('reason', filters.reason)
      if (filters.search) params.set('search', filters.search)
      const { data } = await api.get(`/property-reports/admin?${params.toString()}`)
      setReports(data.reports || [])
      setState({ loading: false, error: '' })
    } catch (error) {
      setState({ loading: false, error: error.response?.data?.message || 'Failed to load property reports.' })
    }
  }

  useEffect(() => {
    loadReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.reason])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFilters((previous) => ({ ...previous, [name]: value }))
  }

  const handleSearch = (event) => {
    event.preventDefault()
    loadReports()
  }

  return (
    <>
      <Navbar />
      <main className="page-wrap report-page-wrap">
        <section className="card admin-hero-card">
          <p className="badge">Admin Trust & Safety</p>
          <h1>Property Reports</h1>
          <p>Review tenant listing reports privately. Managers do not receive these reports directly.</p>
          <div className="hero-actions" style={{ marginTop: '18px' }}>
            <Link to="/admin" className="secondary-btn">Back to Admin Center</Link>
          </div>
        </section>

        <section className="card admin-panel-card">
          <div className="manager-list-header">
            <div>
              <h2>Submitted Reports</h2>
              <p>Filter by status, reason, or search property, tenant, manager, and report text.</p>
            </div>
          </div>

          <form className="admin-filter-bar" onSubmit={handleSearch}>
            <input name="search" value={filters.search} onChange={handleChange} placeholder="Search property, tenant, manager, reason" />
            <select name="status" value={filters.status} onChange={handleChange}>
              {STATUS_FILTERS.map((item) => <option key={item.value || 'all'} value={item.value}>{item.label}</option>)}
            </select>
            <select name="reason" value={filters.reason} onChange={handleChange}>
              {REASON_FILTERS.map((item) => <option key={item.value || 'all'} value={item.value}>{item.label}</option>)}
            </select>
            <button type="submit" className="primary-btn">Search</button>
          </form>

          {state.loading ? <p className="center-inline-message">Loading property reports...</p> : null}
          {state.error ? <p className="error-text">{state.error}</p> : null}

          {!state.loading ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Reported Property</th>
                    <th>Reason</th>
                    <th>Reported By</th>
                    <th>Manager</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Reply Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report._id}>
                      <td>{report.property?.title || 'Unknown property'}</td>
                      <td>{reasonLabel(report.reason)}</td>
                      <td>{report.reportedBy?.name || 'Tenant'}<br /><small>{report.reportedBy?.email || ''}</small></td>
                      <td>{report.propertyManager?.name || 'Manager'}<br /><small>{report.propertyManager?.email || ''}</small></td>
                      <td><span className={`admin-status-pill status-${report.status}`}>{report.status}</span></td>
                      <td>{formatDate(report.createdAt)}</td>
                      <td>{report.adminReply?.message ? 'Replied' : 'No reply yet'}</td>
                      <td><Link to={`/admin/reports/${report._id}`} className="secondary-btn">View</Link></td>
                    </tr>
                  ))}
                  {!reports.length ? (
                    <tr>
                      <td colSpan="8">No property reports found.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </main>
    </>
  )
}
