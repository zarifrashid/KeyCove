import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

function formatDate(value) {
  if (!value) return 'Not available'
  return new Date(value).toLocaleString()
}

function getStatusLabel(status) {
  if (status === 'approved') return 'Accepted'
  if (status === 'rejected') return 'Rejected'
  return 'Pending'
}

function getActionLabel(actionType) {
  if (actionType === 'buy') return 'Buy Request'
  if (actionType === 'lease') return 'Lease Request'
  return 'Rental Request'
}

export default function PropertyRequestDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [request, setRequest] = useState(null)
  const [state, setState] = useState({ loading: true, error: '' })

  useEffect(() => {
    const loadRequest = async () => {
      try {
        setState({ loading: true, error: '' })
        const { data } = await api.get(`/property-requests/${id}`)
        setRequest(data.request || null)
        setState({ loading: false, error: '' })
      } catch (error) {
        setState({ loading: false, error: error.response?.data?.message || 'Failed to load property request.' })
      }
    }

    loadRequest()
  }, [id])

  const property = request?.property
  const manager = request?.manager
  const tenant = request?.tenant
  const status = request?.status || 'pending'
  const statusLabel = getStatusLabel(status)
  const actionLabel = getActionLabel(request?.actionType)

  const handleMessageManager = async () => {
    if (!property?._id) return
    if (user?.role === 'tenant') {
      const { data } = await api.post('/chat/conversations', { propertyId: property._id })
      navigate(`/messages?conversation=${data.conversation?._id || ''}`)
      return
    }
    navigate('/messages')
  }

  return (
    <>
      <Navbar />
      <main className="page-wrap property-request-details-wrap">
        {state.loading ? <p className="center-box">Loading request details...</p> : null}
        {state.error ? (
          <section className="card request-detail-card">
            <p className="error-text">{state.error}</p>
            <button type="button" className="secondary-btn" onClick={() => navigate('/notifications')}>Back to notifications</button>
          </section>
        ) : null}

        {!state.loading && !state.error && request ? (
          <section className={`card request-detail-card request-status-${status}`}>
            <p className="badge">{actionLabel}</p>
            <div className="request-detail-header">
              <div>
                <h1>{statusLabel}: {property?.title || 'Property request'}</h1>
                <p>
                  {status === 'approved'
                    ? `Your ${request.actionType} request has been accepted. Review the details and continue with the next step.`
                    : status === 'rejected'
                      ? `Your ${request.actionType} request was rejected. You can continue browsing other KeyCove listings.`
                      : `Your ${request.actionType} request is still pending manager review.`}
                </p>
              </div>
              <span className={`request-status-pill status-${status}`}>{statusLabel}</span>
            </div>

            <div className="request-detail-grid">
              <div>
                <strong>Property</strong>
                <span>{property?.title || '-'}</span>
              </div>
              <div>
                <strong>Request Type</strong>
                <span>{request.actionType}</span>
              </div>
              <div>
                <strong>Status</strong>
                <span>{statusLabel}</span>
              </div>
              <div>
                <strong>Submitted</strong>
                <span>{formatDate(request.createdAt)}</span>
              </div>
              <div>
                <strong>Reviewed</strong>
                <span>{formatDate(request.reviewedAt)}</span>
              </div>
              <div>
                <strong>Occupancy</strong>
                <span>{request.occupancyStatus || '-'}</span>
              </div>
              <div>
                <strong>Manager</strong>
                <span>{manager?.companyName || manager?.name || '-'}</span>
              </div>
              <div>
                <strong>Tenant</strong>
                <span>{tenant?.name || request.tenantSnapshot?.name || '-'}</span>
              </div>
            </div>

            {request.note ? (
              <div className="request-note-box">
                <strong>Your message</strong>
                <p>{request.note}</p>
              </div>
            ) : null}

            <div className="request-next-step-card">
              <h2>Next step</h2>
              {status === 'approved' ? (
                <p>
                  {request.actionType === 'buy'
                    ? 'Contact the manager to discuss purchase details, documents, and final handover steps.'
                    : 'You can contact the manager or review lease/current residence information from your dashboard.'}
                </p>
              ) : null}
              {status === 'pending' ? <p>The manager has not reviewed this request yet. You can still view the property or message the manager.</p> : null}
              {status === 'rejected' ? <p>This request is closed. You can go back to Explore Map and find another suitable property.</p> : null}
            </div>

            <div className="request-detail-actions">
              {property?._id ? <Link to={`/properties/${property._id}`} className="secondary-btn">View Property</Link> : null}
              {user?.role !== 'admin' ? (
                <button type="button" className="primary-btn" onClick={handleMessageManager}>
                  {user?.role === 'tenant' ? 'Message Manager' : 'Open Messages'}
                </button>
              ) : null}
              <Link to="/dashboard" className="secondary-btn">Go to Dashboard</Link>
            </div>
          </section>
        ) : null}
      </main>
    </>
  )
}
