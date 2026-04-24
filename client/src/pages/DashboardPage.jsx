import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ManagerPropertyList from '../components/property/ManagerPropertyList'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import RecommendationSection from '../components/recommendations/RecommendationSection'
import SavedPropertiesSection from '../components/bookmarks/SavedPropertiesSection'
import RequestSection from '../components/requests/RequestSection'

export default function DashboardPage() {
  const { user } = useAuth()
  const location = useLocation()
  const [managerState, setManagerState] = useState({ loading: user?.role === 'manager', deletingId: '', error: '', properties: [] })
  const [flashMessage, setFlashMessage] = useState(location.state?.flashMessage || '')
  const [unreadTotal, setUnreadTotal] = useState(0)
  const [requestState, setRequestState] = useState({ loading: Boolean(user), reviewingId: '', error: '', requests: [] })

  useEffect(() => {
    if (user?.role !== 'manager') return

    const fetchMyProperties = async () => {
      try {
        setManagerState((previous) => ({ ...previous, loading: true, error: '' }))
        const { data } = await api.get('/properties/mine')
        setManagerState({ loading: false, deletingId: '', error: '', properties: data.properties || [] })
      } catch (error) {
        setManagerState((previous) => ({
          ...previous,
          loading: false,
          error: error.response?.data?.message || 'Failed to load your properties.'
        }))
      }
    }

    fetchMyProperties()
  }, [location.key, location.state?.refreshManagerProperties, user?.role])

  useEffect(() => {
    if (!user) return

    const fetchUnreadSummary = async () => {
      try {
        const { data } = await api.get('/chat/unread-summary')
        setUnreadTotal(data.unreadTotal || 0)
      } catch (_) {
        setUnreadTotal(0)
      }
    }

    fetchUnreadSummary()
  }, [location.key, user])

  useEffect(() => {
    if (!user) return

    const fetchRequests = async () => {
      try {
        setRequestState((previous) => ({ ...previous, loading: true, error: '' }))
        const endpoint = user.role === 'manager' ? '/property-requests/manager' : '/property-requests/mine'
        const { data } = await api.get(endpoint)
        setRequestState((previous) => ({ ...previous, loading: false, requests: data.requests || [] }))
      } catch (error) {
        setRequestState((previous) => ({
          ...previous,
          loading: false,
          error: error.response?.data?.message || 'Failed to load property requests.'
        }))
      }
    }

    fetchRequests()
  }, [location.key, user])

  const handleReviewRequest = async (requestId, status) => {
    try {
      setRequestState((previous) => ({ ...previous, reviewingId: requestId, error: '' }))
      const { data } = await api.patch(`/property-requests/${requestId}/status`, { status })
      setRequestState((previous) => ({
        ...previous,
        reviewingId: '',
        requests: previous.requests.map((item) => item._id === requestId ? data.request : item)
      }))
      setFlashMessage(
        status === 'approved'
          ? 'Request approved successfully. Create the lease from Lease Details when you are ready.'
          : 'Request rejected successfully.'
      )
    } catch (error) {
      setRequestState((previous) => ({
        ...previous,
        reviewingId: '',
        error: error.response?.data?.message || 'Failed to update the request.'
      }))
    }
  }

  const handleDelete = async (propertyId) => {
    const confirmed = window.confirm('Are you sure you want to delete this property?')
    if (!confirmed) return

    try {
      setManagerState((previous) => ({ ...previous, deletingId: propertyId, error: '' }))
      await api.delete(`/properties/${propertyId}`)
      setManagerState((previous) => ({
        ...previous,
        deletingId: '',
        properties: previous.properties.filter((item) => item._id !== propertyId)
      }))
      setFlashMessage('Property deleted successfully.')
    } catch (error) {
      setManagerState((previous) => ({
        ...previous,
        deletingId: '',
        error: error.response?.data?.message || 'Failed to delete property.'
      }))
    }
  }

  if (user?.role === 'manager') {
    return (
      <>
        <Navbar unreadMessages={unreadTotal} />
        <div className="page-wrap manager-dashboard-wrap">
          <div className="manager-dashboard-shell">
            <section className="card manager-dashboard-hero">
              <p className="badge">Manager Dashboard</p>
              <h2>Welcome, {user?.name || 'Manager'}</h2>
              <p>
                Create, edit, publish, and manage your listings here. Published properties appear automatically in Explore Map,
                search results, filters, and sorting.
              </p>
              <div className="manager-dashboard-actions">
                <Link to="/add-property" className="primary-btn">Add New Property</Link>
                <Link to="/manager/leases" className="secondary-btn">Lease Details</Link>
                <Link to="/explore" className="secondary-btn">Open Explore Map</Link>
                <Link to="/messages" className="secondary-btn">Messages{unreadTotal ? ` (${unreadTotal})` : ''}</Link>
            <Link to="/shared-boards" className="secondary-btn">Shared Search</Link>
              </div>
              <div className="info-grid manager-info-grid">
                <div><strong>Name:</strong> {user?.name}</div>
                <div><strong>Email:</strong> {user?.email}</div>
                <div><strong>Role:</strong> {user?.role}</div>
                <div><strong>Listings:</strong> {managerState.properties.length}</div>
                <div><strong>Unread Messages:</strong> {unreadTotal}</div>
              </div>
            </section>

            <section className="card manager-dashboard-list-card">
              <div className="manager-list-header">
                <div>
                  <h3>Your Properties</h3>
                  <p>Draft and published listings are managed from here.</p>
                </div>
              </div>

              {flashMessage ? <p className="success-text manager-flash-text">{flashMessage}</p> : null}
              {managerState.error ? <p className="error-text manager-flash-text">{managerState.error}</p> : null}
              {managerState.loading ? (
                <div className="manager-empty-state">
                  <h3>Loading properties...</h3>
                </div>
              ) : (
                <ManagerPropertyList
                  properties={managerState.properties}
                  onDelete={handleDelete}
                  deletingId={managerState.deletingId}
                />
              )}
            </section>

            <RequestSection
              title="Tenant Requests"
              subtitle="Review rent, lease, and buy requests submitted for your properties. Lease creation stays separate inside Lease Details."
              requests={requestState.requests}
              loading={requestState.loading}
              error={requestState.error}
              emptyText="No property requests have arrived yet."
              isManager
              onReview={handleReviewRequest}
              reviewingId={requestState.reviewingId}
            />
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar unreadMessages={unreadTotal} />
      <div className="page-wrap dashboard-stack">
        <div className="card dashboard-card">
          <p className="badge">Tenant Dashboard</p>
          <h2>Welcome, {user?.name || 'User'}</h2>
          <p>Your account is active. Explore listings, save favorites, track request history, and open your dedicated My Leases page directly from the top navigation bar.</p>
          <div className="info-grid">
            <div><strong>Name:</strong> {user?.name}</div>
            <div><strong>Email:</strong> {user?.email}</div>
            <div><strong>Role:</strong> {user?.role}</div>
            <div><strong>User ID:</strong> {user?.id}</div>
            <div><strong>Unread Messages:</strong> {unreadTotal}</div>
          </div>
          <div className="hero-actions" style={{ marginTop: '24px' }}>
            <Link to="/explore" className="primary-btn">Explore Properties</Link>
            <Link to="/affordability" className="secondary-btn">Affordability Analyzer</Link>
            <Link to="/recommendations" className="secondary-btn">View Recommendations</Link>
            <Link to="/shared-boards" className="secondary-btn">Shared Search</Link>
            <Link to="/messages" className="secondary-btn">Messages{unreadTotal ? ` (${unreadTotal})` : ''}</Link>
            <Link to="/shared-boards" className="secondary-btn">Shared Search</Link>
          </div>
        </div>

        <RequestSection
          title="Your Property Requests"
          subtitle="Track the rent, lease, and buy requests you have already submitted. Lease records now live separately in My Leases."
          requests={requestState.requests}
          loading={requestState.loading}
          error={requestState.error}
          emptyText="You have not submitted any property requests yet."
        />

        <SavedPropertiesSection />
        <RecommendationSection compact />
      </div>
    </>
  )
}
