import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ManagerPropertyList from '../components/property/ManagerPropertyList'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import RecommendationSection from '../components/recommendations/RecommendationSection'
import SavedPropertiesSection from '../components/bookmarks/SavedPropertiesSection'
import useFavorites from '../hooks/useFavorites'

export default function DashboardPage() {
  const { user } = useAuth()
  const { favorites, favoriteIds, toggleFavorite, pendingPropertyIds, loading: favoritesLoading } = useFavorites()
  const location = useLocation()
  const [managerState, setManagerState] = useState({ loading: user?.role === 'manager', deletingId: '', error: '', properties: [] })
  const [flashMessage, setFlashMessage] = useState(location.state?.flashMessage || '')

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
        <Navbar />
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
                <Link to="/explore" className="secondary-btn">Open Explore Map</Link>
              </div>
              <div className="info-grid manager-info-grid">
                <div><strong>Name:</strong> {user?.name}</div>
                <div><strong>Email:</strong> {user?.email}</div>
                <div><strong>Role:</strong> {user?.role}</div>
                <div><strong>Listings:</strong> {managerState.properties.length}</div>
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
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="page-wrap dashboard-stack">
        <div className="card dashboard-card">
          <p className="badge">Tenant Dashboard</p>
          <h2>Welcome, {user?.name || 'User'}</h2>
          <p>Your account is active. Explore listings, save favorites, and get smarter recommendations as you browse.</p>
          <div className="info-grid">
            <div><strong>Name:</strong> {user?.name}</div>
            <div><strong>Email:</strong> {user?.email}</div>
            <div><strong>Role:</strong> {user?.role}</div>
            <div><strong>User ID:</strong> {user?.id}</div>
          </div>
          <div className="hero-actions" style={{ marginTop: '24px' }}>
            <Link to="/explore" className="primary-btn">Explore Properties</Link>
            <Link to="/affordability" className="secondary-btn">Affordability Analyzer</Link>
            <Link to="/recommendations" className="secondary-btn">View Recommendations</Link>
          </div>
        </div>


        {user?.role === 'tenant' ? (
          favoritesLoading ? (
            <section className="card saved-properties-section">
              <div className="saved-properties-header">
                <div>
                  <p className="badge">Bookmarks</p>
                  <h2>Saved Properties</h2>
                  <p>Loading your saved properties...</p>
                </div>
              </div>
            </section>
          ) : (
            <SavedPropertiesSection
              favorites={favorites}
              favoriteIds={favoriteIds}
              onToggleFavorite={toggleFavorite}
              pendingPropertyIds={pendingPropertyIds}
            />
          )
        ) : null}

        <RecommendationSection compact />
      </div>
    </>
  )
}
