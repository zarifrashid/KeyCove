import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import useFavorites from '../../hooks/useFavorites'
import RecommendationCard from './RecommendationCard'
import RecommendationOnboarding from './RecommendationOnboarding'

const SEEN_STORAGE_KEY = 'kc_seen_recommendation_ids'

function mergeUniqueRecommendations(existingItems = [], nextItems = []) {
  const seen = new Set(existingItems.map((item) => item.property?._id).filter(Boolean))
  const merged = [...existingItems]

  nextItems.forEach((item) => {
    const propertyId = item.property?._id
    if (!propertyId || seen.has(propertyId)) return
    seen.add(propertyId)
    merged.push(item)
  })

  return merged
}

function readSeenIds() {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(SEEN_STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.filter(Boolean) : []
  } catch {
    return []
  }
}

function writeSeenIds(ids = []) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(Array.from(new Set(ids.filter(Boolean)))))
}

export default function RecommendationSection({ compact = false }) {
  const { user } = useAuth()
  const { favoriteIds, toggleFavorite } = useFavorites()
  const [state, setState] = useState({
    loading: user?.role === 'tenant',
    error: '',
    items: [],
    summary: '',
    preferenceChips: [],
    affordabilitySummary: '',
    needsOnboarding: false,
    onboardingBusy: false,
    onboardingOpen: false,
    emptyFreshBatch: false
  })
  const [bookmarkBusyId, setBookmarkBusyId] = useState('')
  const seenIdsRef = useRef(readSeenIds())

  const visibleIds = useMemo(
    () => state.items.map((item) => item.property?._id).filter(Boolean),
    [state.items]
  )

  useEffect(() => {
    const mergedSeen = Array.from(new Set([...seenIdsRef.current, ...visibleIds]))
    seenIdsRef.current = mergedSeen
    writeSeenIds(mergedSeen)
  }, [visibleIds])

  const applyResponse = useCallback((data, options = {}) => {
    const { replace = true } = options
    const incomingItems = data.recommendations || []

    setState((previous) => ({
      ...previous,
      loading: false,
      error: '',
      items: replace ? incomingItems : mergeUniqueRecommendations(previous.items, incomingItems),
      summary: data.preferenceSummary || '',
      preferenceChips: data.preferenceChips || [],
      affordabilitySummary: data.affordabilitySummary || '',
      needsOnboarding: Boolean(data.needsOnboarding),
      onboardingOpen: previous.onboardingOpen || Boolean(data.needsOnboarding),
      emptyFreshBatch: !replace && incomingItems.length === 0
    }))
  }, [])

  const fetchRecommendations = useCallback(async ({ replace = true, limit = compact ? 3 : 8, resetSeen = false } = {}) => {
    if (user?.role !== 'tenant') return

    try {
      setState((previous) => ({ ...previous, loading: true, error: '', emptyFreshBatch: false }))

      if (resetSeen) {
        seenIdsRef.current = []
        writeSeenIds([])
      }

      const excludeIds = compact ? [] : seenIdsRef.current
      const query = new URLSearchParams({ limit: String(limit) })
      if (excludeIds.length) query.set('exclude', excludeIds.join(','))

      const { data } = await api.get(`/recommendations?${query.toString()}`)

      if ((data.recommendations || []).length === 0 && excludeIds.length) {
        seenIdsRef.current = []
        writeSeenIds([])
        const retry = await api.get(`/recommendations?limit=${limit}`)
        applyResponse(retry.data, { replace })
        setState((previous) => ({ ...previous, emptyFreshBatch: true }))
        return
      }

      applyResponse(data, { replace })
    } catch (error) {
      setState((previous) => ({
        ...previous,
        loading: false,
        error: error.response?.data?.message || 'Failed to load recommendations.'
      }))
    }
  }, [applyResponse, compact, user?.role])

  useEffect(() => {
    fetchRecommendations({ replace: true })
  }, [fetchRecommendations])

  if (user?.role !== 'tenant') return null

  const handleSaveToggle = async (item) => {
    try {
      setBookmarkBusyId(item.property._id)
      await toggleFavorite(item.property._id, item.recommendationId)
      setState((previous) => ({
        ...previous,
        items: previous.items.filter((current) => current.property._id !== item.property._id)
      }))
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
    await api.post(`/recommendations/${item.recommendationId}/feedback`, { feedbackType: 'not_interested' }).catch(() => null)

    setState((previous) => ({
      ...previous,
      items: previous.items.filter((current) => current.recommendationId !== item.recommendationId)
    }))

    if (!compact) {
      await fetchRecommendations({ replace: false, limit: 1 })
    }
  }

  const handleOnboardingSave = async (answers) => {
    setState((previous) => ({ ...previous, onboardingBusy: true, error: '' }))

    try {
      const { data } = await api.post('/recommendations/preferences/onboarding', answers)
      seenIdsRef.current = []
      writeSeenIds([])
      setState((previous) => ({
        ...previous,
        onboardingBusy: false,
        onboardingOpen: false,
        needsOnboarding: false,
        items: data.recommendations?.recommendations || [],
        summary: data.recommendations?.preferenceSummary || '',
        preferenceChips: data.recommendations?.preferenceChips || [],
        affordabilitySummary: data.recommendations?.affordabilitySummary || previous.affordabilitySummary,
        emptyFreshBatch: false
      }))
    } catch (error) {
      setState((previous) => ({
        ...previous,
        onboardingBusy: false,
        error: error.response?.data?.message || 'Failed to save your preferences.'
      }))
      throw error
    }
  }

  const openPreferenceQuiz = () => {
    setState((previous) => ({ ...previous, onboardingOpen: !previous.onboardingOpen }))
  }

  const hasItems = state.items.length > 0

  return (
    <section className={`card recommendation-section ${compact ? 'compact-recommendations' : ''}`}>
      <div className="recommendation-section-header">
        <div>
          <p className="badge">Suggested for You</p>
          <h2>Recommended for You</h2>
          {state.summary ? <p>{state.summary}</p> : <p>Personalized using your activity, saved homes, budget fit, and feedback.</p>}
          {state.preferenceChips?.length ? (
            <div className="recommendation-profile-strip">
              {state.preferenceChips.map((chip) => (
                <span key={chip} className="recommendation-profile-chip">{chip}</span>
              ))}
            </div>
          ) : null}
          {state.affordabilitySummary ? <p className="recommendation-subnote">{state.affordabilitySummary}</p> : null}
        </div>

        <div className="recommendation-header-actions">
          {!compact ? (
            <button type="button" className="secondary-btn" onClick={openPreferenceQuiz}>
              {state.onboardingOpen ? 'Hide preference quiz' : 'Tune my feed'}
            </button>
          ) : null}

          {compact ? (
            <Link to="/recommendations" className="secondary-btn">See More</Link>
          ) : (
            <button type="button" className="secondary-btn" onClick={() => fetchRecommendations({ replace: true, limit: 8, resetSeen: false })}>
              Load fresh batch
            </button>
          )}
        </div>
      </div>

      {!compact && state.onboardingOpen ? (
        <RecommendationOnboarding
          busy={state.onboardingBusy}
          onSave={handleOnboardingSave}
          onSkip={() => setState((previous) => ({ ...previous, onboardingOpen: false }))}
        />
      ) : null}

      {state.loading ? <p>Loading recommendations...</p> : null}
      {state.error ? <p className="error-text">{state.error}</p> : null}
      {state.emptyFreshBatch ? <p className="recommendation-subnote">You have reached the end of the fresh batch, so KeyCove restarted from your best available matches.</p> : null}

      {!state.loading && !hasItems ? (
        <div className="empty-state compact-empty-state">
          <h3>No recommendations yet</h3>
          <p>Answer the quick preference quiz or explore a few listings to unlock smarter matches.</p>
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
            showSeeMoreLink={compact}
          />
        ))}
      </div>
    </section>
  )
}
