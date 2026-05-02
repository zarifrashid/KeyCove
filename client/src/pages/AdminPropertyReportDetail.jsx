import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { api } from '../lib/api'

const REASON_LABELS = {
  fake_listing: 'Fake listing',
  wrong_rent: 'Wrong rent',
  wrong_location: 'Wrong location',
  wrong_property_information: 'Wrong property information',
  misleading_photos: 'Misleading photos',
  property_already_rented: 'Property already rented',
  duplicate_listing: 'Duplicate listing',
  inappropriate_content: 'Inappropriate content',
  suspicious_manager: 'Suspicious manager',
  other: 'Other'
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

function reasonLabel(reason) {
  return REASON_LABELS[reason] || reason || '-'
}

export default function AdminPropertyReportDetail() {
  const { reportId } = useParams()
  const [report, setReport] = useState(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [state, setState] = useState({ loading: true, action: '', error: '', message: '' })

  const loadReport = async () => {
    try {
      setState((previous) => ({ ...previous, loading: true, error: '' }))
      const { data } = await api.get(`/property-reports/admin/${reportId}`)
      setReport(data.report || null)
      setReplyMessage(data.report?.adminReply?.message || '')
      setInternalNote(data.report?.adminInternalNote || '')
      setState({ loading: false, action: '', error: '', message: '' })
    } catch (error) {
      setState({ loading: false, action: '', error: error.response?.data?.message || 'Failed to load report.', message: '' })
    }
  }

  useEffect(() => {
    loadReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId])

  const handleReply = async (event) => {
    event.preventDefault()
    try {
      setState((previous) => ({ ...previous, action: 'reply', error: '', message: '' }))
      const { data } = await api.patch(`/property-reports/admin/${reportId}/reply`, { message: replyMessage })
      setReport(data.report)
      setState({ loading: false, action: '', error: '', message: data.message || 'Reply sent to tenant.' })
    } catch (error) {
      setState((previous) => ({ ...previous, action: '', error: error.response?.data?.message || 'Failed to send reply.', message: '' }))
    }
  }

  const handleStatus = async (status) => {
    try {
      setState((previous) => ({ ...previous, action: status, error: '', message: '' }))
      const { data } = await api.patch(`/property-reports/admin/${reportId}/status`, { status, adminInternalNote: internalNote })
      setReport(data.report)
      setState({ loading: false, action: '', error: '', message: data.message || 'Report status updated.' })
    } catch (error) {
      setState((previous) => ({ ...previous, action: '', error: error.response?.data?.message || 'Failed to update status.', message: '' }))
    }
  }

  const propertyAddress = [report?.property?.location?.address, report?.property?.location?.area, report?.property?.location?.city].filter(Boolean).join(', ')

  return (
    <>
      <Navbar />
      <main className="page-wrap report-page-wrap">
        <section className="card admin-hero-card">
          <p className="badge">Property Report Detail</p>
          <h1>Admin Review</h1>
          <p>This report is private to admins. Reply to the tenant or update the review status.</p>
          <div className="hero-actions" style={{ marginTop: '18px' }}>
            <Link to="/admin/reports" className="secondary-btn">Back to Property Reports</Link>
          </div>
        </section>

        {state.loading ? <p className="center-box">Loading report...</p> : null}
        {state.error ? <p className="error-text">{state.error}</p> : null}
        {state.message ? <p className="success-text">{state.message}</p> : null}

        {report ? (
          <div className="report-detail-grid">
            <section className="card report-detail-card">
              <div className="manager-list-header">
                <div>
                  <p className="badge">Report Information</p>
                  <h2>{reasonLabel(report.reason)}</h2>
                </div>
                <span className={`admin-status-pill status-${report.status}`}>{report.status}</span>
              </div>
              <div className="report-info-grid">
                <div><strong>Report ID:</strong> {report._id}</div>
                <div><strong>Submitted:</strong> {formatDate(report.createdAt)}</div>
                <div><strong>Status:</strong> {report.status}</div>
                <div><strong>Reason:</strong> {reasonLabel(report.reason)}</div>
              </div>
              <div className="report-message-box">
                <strong>Tenant Comment</strong>
                <p>{report.comment || 'No additional comment was provided.'}</p>
              </div>
            </section>

            <section className="card report-detail-card">
              <p className="badge">Reported Property</p>
              <h2>{report.property?.title || 'Unknown property'}</h2>
              <div className="report-info-grid">
                <div><strong>Address:</strong> {propertyAddress || '-'}</div>
                <div><strong>Price/Rent:</strong> ৳ {Number(report.property?.rentPrice || report.property?.price || report.property?.salePrice || 0).toLocaleString()}</div>
                <div><strong>Property Type:</strong> {report.property?.propertyType || '-'}</div>
                <div><strong>Status:</strong> {report.property?.status || '-'}</div>
              </div>
              {report.property?._id ? <Link to={`/properties/${report.property._id}`} className="secondary-btn">View Property</Link> : null}
            </section>

            <section className="card report-detail-card">
              <p className="badge">Reporter Information</p>
              <h2>{report.reportedBy?.name || 'Tenant'}</h2>
              <div className="report-info-grid">
                <div><strong>Email:</strong> {report.reportedBy?.email || '-'}</div>
                <div><strong>Phone:</strong> {report.reportedBy?.phone || '-'}</div>
              </div>
            </section>

            <section className="card report-detail-card">
              <p className="badge">Manager Information</p>
              <h2>{report.propertyManager?.name || 'Manager'}</h2>
              <div className="report-info-grid">
                <div><strong>Email:</strong> {report.propertyManager?.email || '-'}</div>
                <div><strong>Phone:</strong> {report.propertyManager?.phone || '-'}</div>
                <div><strong>Company:</strong> {report.propertyManager?.companyName || '-'}</div>
              </div>
            </section>

            <section className="card report-detail-card report-detail-wide">
              <p className="badge">Reply to Tenant</p>
              <h2>Admin Response Section</h2>
              <form className="report-form" onSubmit={handleReply}>
                <label>
                  Write a response to the tenant…
                  <textarea value={replyMessage} onChange={(event) => setReplyMessage(event.target.value)} rows="5" maxLength="3000" required />
                </label>
                <button type="submit" className="primary-btn" disabled={state.action === 'reply'}>
                  {state.action === 'reply' ? 'Sending...' : 'Send Reply'}
                </button>
              </form>
              {report.adminReply?.message ? (
                <div className="report-message-box">
                  <strong>Current Admin Response</strong>
                  <p>{report.adminReply.message}</p>
                  <small>Sent {formatDate(report.adminReply.repliedAt)} by {report.adminReply.repliedBy?.name || 'Admin'}</small>
                </div>
              ) : null}
            </section>

            <section className="card report-detail-card report-detail-wide">
              <p className="badge">Admin Action Section</p>
              <h2>Review Actions</h2>
              <label className="report-note-label">
                Internal admin note
                <textarea value={internalNote} onChange={(event) => setInternalNote(event.target.value)} rows="4" placeholder="Visible to admins only." />
              </label>
              <div className="admin-action-row">
                <button type="button" className="secondary-btn" onClick={() => handleStatus('reviewed')} disabled={Boolean(state.action)}>Mark as Reviewed</button>
                <button type="button" className="primary-btn" onClick={() => handleStatus('resolved')} disabled={Boolean(state.action)}>Mark as Resolved</button>
                <button type="button" className="danger-btn" onClick={() => handleStatus('dismissed')} disabled={Boolean(state.action)}>Dismiss Report</button>
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </>
  )
}
