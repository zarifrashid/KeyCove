import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'

export default function useFavorites() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(Boolean(user && user.role === 'tenant'))

  const favoriteIds = useMemo(() => new Set(favorites.map((item) => item.property?._id || item.property)), [favorites])

  const refreshFavorites = useCallback(async () => {
    if (!user || user.role !== 'tenant') {
      setFavorites([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data } = await api.get('/recommendations/favorites')
      setFavorites(data.favorites || [])
    } catch (_) {
      setFavorites([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refreshFavorites()
  }, [refreshFavorites])

  const saveFavorite = useCallback(async (propertyId, recommendationId = null) => {
    const { data } = await api.post('/recommendations/favorites', { propertyId, recommendationId })
    await refreshFavorites()
    return data
  }, [refreshFavorites])

  const removeFavorite = useCallback(async (propertyId) => {
    const { data } = await api.delete(`/recommendations/favorites/${propertyId}`)
    await refreshFavorites()
    return data
  }, [refreshFavorites])

  return {
    favorites,
    favoriteIds,
    loading,
    refreshFavorites,
    saveFavorite,
    removeFavorite
  }
}
