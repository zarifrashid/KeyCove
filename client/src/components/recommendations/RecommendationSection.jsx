import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import useFavorites from '../../hooks/useFavorites'
import RecommendationCard from './RecommendationCard'

export default function RecommendationSection({ compact = false }) {
  const { user } = useAuth()
  const { favoriteIds, toggleFavorite } = useFavorites()
  const [state, setState] = useState({ loading: user?.role === 'tenant', error: '', items: [], summary: '' })
  const [bookmarkBusyId, setBookmarkBusyId] = useState('')

  useEffect(() => {
    if (user?.role !== 'tenant') return

    const fetchRecommendations = async () => {
      try {
        setState((previous) => ({ ...previous, loading: true, error: '' }))
        const { data } = await api.get(`/recommendations?limit=${compact ? 3 : 9}`)
        setState({
          loading: false,
          error: '',
          items: data.recommendations || [],
          summary: data.preferenceSummary || ''
        })
      } catch (error) {
        setState({ loading: false, error: error.response?.data?.message || 'Failed to load recommendations.', items: [], summary: '' })
      }
    }

    fetchRecommendations()
  }, [compact, user?.role])

  if (user?.role !== 'tenant') return null

  const handleSaveToggle = async (item) => {
    try {
      setBookmarkBusyId(item.property._id)
      await toggleFavorite(item.property._id, item.recommendationId)
    } finally {
      setBookmarkBusyId('')
    }
  }

  const handleTrackClick = async (item) => {
    if (!item.recommendationId) return
    await api.post(`/recommendations/${item.recommendationId}/feedback`, { feedbackType: 'clicked' }).catch(() => null)
  }

  const handleNotInterested = async (item) => {
    if (!item.recommendationId) return
    await api.post(`/recommendations/${item.recommendationId}/feedback`, { feedbackType: 'not_interested' })
    setState((previous) => ({
      ...previous,
      items: previous.items.filter((current) => current.recommendationId !== item.recommendationId)
    }))
  }

  return (
    <section className={`card recommendation-section ${compact ? 'compact-recommendations' : ''}`}>
      <div className="recommendation-section-header">
        <div>
          <p className="badge">Suggested for You</p>
          <h2>Recommended for You</h2>
          <p>{state.summary || 'Personalized using searches, views, saves, and feedback.'}</p>
        </div>
        <Link to="/recommendations" className="secondary-btn">See More</Link>
      </div>

      {state.loading ? <p>Loading recommendations...</p> : null}
      {state.error ? <p className="error-text">{state.error}</p> : null}
      {!state.loading && !state.items.length ? (
        <div className="empty-state compact-empty-state">
          <h3>No recommendations yet</h3>
          <p>Explore a few properties and KeyCove will personalize this section.</p>
        </div>
      ) : null}

      <div className={`recommendation-grid ${compact ? 'compact' : ''}`}>
        {state.items.map((item) => (
          <RecommendationCard
            key={item.recommendationId || item.property._id}
            item={item}
            isSaved={favoriteIds.has(item.property._id)}
            onSaveToggle={handleSaveToggle}
            onNotInterested={handleNotInterested}
            onTrackClick={handleTrackClick}
            bookmarkBusy={bookmarkBusyId === item.property._id}
          />
        ))}
      </div>
    </section>
  )
}
