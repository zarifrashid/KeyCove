import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { api } from '../lib/api'

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

export default function TenantReportDetail() {
  const { reportId } = useParams()
  const [report, setReport] = useState(null)
  const [state, setState] = useState({ loading: true, error: '' })

  useEffect(() => {
    const loadReport = async () => {
      try {
        setState({ loading: true, error: '' })
        const { data } = await api.get(`/property-reports/my/${reportId}`)
        setReport(data.report || null)
        setState({ loading: false, error: '' })
      } catch (error) {
        setState({ loading: false, error: error.response?.data?.message || 'Failed to load report.' })
      }
    }

    loadReport()
  }, [reportId])

  return (
    <>
      <Navbar />
      <main className="page-wrap report-page-wrap">
        <section className="card dashboard-card">
          <p className="badge">My Property Report</p>
          <h1>My Report Details</h1>
          <p>View your original report and the admin response.</p>
          <div className="hero-actions" style={{ marginTop: '18px' }}>
            <Link to="/tenant/reports" className="secondary-btn">Back to My Reports</Link>
          </div>
        </section>

        {state.loading ? <p className="center-box">Loading report...</p> : null}
        {state.error ? <p className="error-text">{state.error}</p> : null}

        {report ? (
          <div className="report-detail-grid">
            <section className="card report-detail-card">
              <p className="badge">Property Reported</p>
              <h2>{report.property?.title || 'Property'}</h2>
              <div className="report-info-grid">
                <div><strong>Status:</strong> {report.property?.status || '-'}</div>
                <div><strong>Type:</strong> {report.property?.propertyType || '-'}</div>
                <div><strong>Location:</strong> {[report.property?.location?.address, report.property?.location?.area, report.property?.location?.city].filter(Boolean).join(', ') || '-'}</div>
              </div>
              {report.property?._id ? <Link to={`/properties/${report.property._id}`} className="secondary-btn">View Property</Link> : null}
            </section>

            <section className="card report-detail-card">
              <p className="badge">My Report</p>
              <h2>{report.reasonLabel}</h2>
              <div className="report-info-grid">
                <div><strong>Status:</strong> {report.status}</div>
                <div><strong>Submitted:</strong> {formatDate(report.createdAt)}</div>
              </div>
              <div className="report-message-box">
                <strong>My Comment</strong>
                <p>{report.comment || 'No additional comment was provided.'}</p>
              </div>
            </section>

            <section className="card report-detail-card report-detail-wide">
              <p className="badge">Admin Reply</p>
              {report.adminReply?.message ? (
                <>
                  <h2>Admin Response</h2>
                  <div className="report-message-box admin-response-box">
                    <p>{report.adminReply.message}</p>
                    <small>Replied {formatDate(report.adminReply.repliedAt)}</small>
                  </div>
                </>
              ) : (
                <>
                  <h2>Still under review</h2>
                  <p>Admin has not replied yet. Your report is still under review.</p>
                </>
              )}
            </section>
          </div>
        ) : null}
      </main>
    </>
  )
}
