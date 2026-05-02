import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import RecentlyViewedCard from '../components/recentlyViewed/RecentlyViewedCard'
import { api } from '../lib/api'

export default function RecentlyViewedPage() {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState({ loading: true, error: '', success: '' })

  const loadRecentlyViewed = async () => {
    try {
      setStatus({ loading: true, error: '', success: '' })
      const { data } = await api.get('/recently-viewed')
      setItems(data.items || [])
      setStatus({ loading: false, error: '', success: '' })
    } catch (error) {
      setStatus({ loading: false, error: error.response?.data?.message || 'Failed to load recently viewed properties.', success: '' })
    }
  }

  useEffect(() => {
    loadRecentlyViewed()
  }, [])

  const handleRemove = async (propertyId) => {
    if (!propertyId) return
    try {
      await api.delete(`/recently-viewed/${propertyId}`)
      setItems((previous) => previous.filter((item) => item.property?._id !== propertyId))
      setStatus((previous) => ({ ...previous, success: 'Property removed from recently viewed.' }))
    } catch (error) {
      setStatus((previous) => ({ ...previous, error: error.response?.data?.message || 'Failed to remove property.' }))
    }
  }

  const handleClearAll = async () => {
    if (!items.length) return
    try {
      await api.delete('/recently-viewed')
      setItems([])
      setStatus({ loading: false, error: '', success: 'Recently viewed properties cleared.' })
    } catch (error) {
      setStatus((previous) => ({ ...previous, error: error.response?.data?.message || 'Failed to clear recently viewed properties.' }))
    }
  }

  return (
    <>
      <Navbar />
      <main className="page-wrap recently-viewed-page">
        <section className="recently-viewed-hero card">
          <div>
            <p className="section-kicker">Property History</p>
            <h1>Recently Viewed Properties</h1>
            <p>Quickly return to properties you opened recently.</p>
          </div>
          {items.length ? (
            <button type="button" className="secondary-btn" onClick={handleClearAll}>
              Clear All
            </button>
          ) : null}
        </section>

        {status.error ? <p className="error-text">{status.error}</p> : null}
        {status.success ? <p className="success-text">{status.success}</p> : null}

        {status.loading ? (
          <div className="center-box">Loading recently viewed properties...</div>
        ) : items.length ? (
          <section className="recently-viewed-grid">
            {items.map((item) => (
              <RecentlyViewedCard key={item._id} item={item} onRemove={handleRemove} />
            ))}
          </section>
        ) : (
          <section className="card recently-viewed-empty">
            <h2>You have not viewed any properties yet.</h2>
            <p>Start exploring listings and they will appear here.</p>
            <Link to="/explore" className="primary-btn">Browse Properties</Link>
          </section>
        )}
      </main>
    </>
  )
}
