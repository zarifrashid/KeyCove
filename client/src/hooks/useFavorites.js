import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const FAVORITES_UPDATED_EVENT = 'keycove:favorites-updated'

export default function useFavorites() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(Boolean(user && user.role === 'tenant'))
  const [pendingPropertyIds, setPendingPropertyIds] = useState(() => new Set())

  const favoriteIds = useMemo(
    () => new Set(favorites.map((item) => String(item.property?._id || item.property)).filter(Boolean)),
    [favorites]
  )

  const isTenant = user?.role === 'tenant'

  const syncFavorites = useCallback((nextFavorites) => {
    setFavorites(Array.isArray(nextFavorites) ? nextFavorites : [])
  }, [])

  const refreshFavorites = useCallback(async () => {
    if (!isTenant) {
      syncFavorites([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data } = await api.get('/bookmarks')
      syncFavorites(data.favorites || [])
    } catch (_) {
      syncFavorites([])
    } finally {
      setLoading(false)
    }
  }, [isTenant, syncFavorites])

  useEffect(() => {
    refreshFavorites()
  }, [refreshFavorites])

  useEffect(() => {
    const handleExternalUpdate = () => {
      refreshFavorites()
    }

    window.addEventListener(FAVORITES_UPDATED_EVENT, handleExternalUpdate)
    return () => window.removeEventListener(FAVORITES_UPDATED_EVENT, handleExternalUpdate)
  }, [refreshFavorites])

  const markPending = useCallback((propertyId, isPending) => {
    setPendingPropertyIds((previous) => {
      const next = new Set(previous)
      if (isPending) next.add(String(propertyId))
      else next.delete(String(propertyId))
      return next
    })
  }, [])

  const emitFavoritesUpdated = () => window.dispatchEvent(new Event(FAVORITES_UPDATED_EVENT))

  const saveFavorite = useCallback(async (propertyId, recommendationId = null) => {
    const normalizedId = String(propertyId)
    if (!isTenant || !normalizedId) return null
    if (favoriteIds.has(normalizedId)) {
      return { success: true, alreadyBookmarked: true }
    }

    markPending(normalizedId, true)
    const optimisticFavorite = {
      _id: `temp-${normalizedId}`,
      property: { _id: normalizedId },
      createdAt: new Date().toISOString(),
      optimistic: true
    }
    syncFavorites([optimisticFavorite, ...favorites.filter((item) => String(item.property?._id || item.property) !== normalizedId)])

    try {
      const { data } = await api.post('/bookmarks', { propertyId: normalizedId, recommendationId })
      await refreshFavorites()
      emitFavoritesUpdated()
      return data
    } catch (error) {
      syncFavorites(favorites)
      throw error
    } finally {
      markPending(normalizedId, false)
    }
  }, [favoriteIds, favorites, isTenant, markPending, refreshFavorites, syncFavorites])

  const removeFavorite = useCallback(async (propertyId) => {
    const normalizedId = String(propertyId)
    if (!isTenant || !normalizedId) return null

    const previousFavorites = favorites
    markPending(normalizedId, true)
    syncFavorites(previousFavorites.filter((item) => String(item.property?._id || item.property) !== normalizedId))

    try {
      const { data } = await api.delete(`/bookmarks/${normalizedId}`)
      emitFavoritesUpdated()
      return data
    } catch (error) {
      syncFavorites(previousFavorites)
      throw error
    } finally {
      markPending(normalizedId, false)
    }
  }, [favorites, isTenant, markPending, syncFavorites])

  const toggleFavorite = useCallback(async (propertyId, recommendationId = null) => {
    const normalizedId = String(propertyId)
    if (favoriteIds.has(normalizedId)) {
      return removeFavorite(normalizedId)
    }
    return saveFavorite(normalizedId, recommendationId)
  }, [favoriteIds, removeFavorite, saveFavorite])

  const isFavorite = useCallback((propertyId) => favoriteIds.has(String(propertyId)), [favoriteIds])

  return {
    favorites,
    favoriteIds,
    pendingPropertyIds,
    loading,
    isFavorite,
    refreshFavorites,
    saveFavorite,
    removeFavorite,
    toggleFavorite
  }
}
