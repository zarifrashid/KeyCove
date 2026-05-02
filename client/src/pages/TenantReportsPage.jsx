import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { api } from '../lib/api'

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

export default function TenantReportsPage() {
  const [reports, setReports] = useState([])
  const [state, setState] = useState({ loading: true, error: '' })

  useEffect(() => {
    const loadReports = async () => {
      try {
        setState({ loading: true, error: '' })
        const { data } = await api.get('/property-reports/my')
        setReports(data.reports || [])
        setState({ loading: false, error: '' })
      } catch (error) {
        setState({ loading: false, error: error.response?.data?.message || 'Failed to load your reports.' })
      }
    }

    loadReports()
  }, [])

  return (
    <>
      <Navbar />
      <main className="page-wrap report-page-wrap">
        <section className="card dashboard-card">
          <p className="badge">My Reports</p>
          <h1>Submitted Property Reports</h1>
          <p>Track the reports you sent to the KeyCove admin team and view admin replies.</p>
        </section>

        <section className="card admin-panel-card">
          {state.loading ? <p>Loading reports...</p> : null}
          {state.error ? <p className="error-text">{state.error}</p> : null}
          {!state.loading && reports.length ? (
            <div className="report-card-list">
              {reports.map((report) => (
                <article className="report-summary-card" key={report._id}>
                  <div>
                    <p className="badge">{report.status}</p>
                    <h3>{report.property?.title || 'Property report'}</h3>
                    <p>{report.reasonLabel}</p>
                    <small>Submitted {formatDate(report.createdAt)}</small>
                  </div>
                  <div className="report-summary-actions">
                    <span>{report.adminReply?.message ? 'Admin replied' : 'No reply yet'}</span>
                    <Link to={`/tenant/reports/${report._id}`} className="secondary-btn">View</Link>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
          {!state.loading && !reports.length ? <p>No reports submitted yet.</p> : null}
        </section>
      </main>
    </>
  )
}
