import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from './AuthContext'
import useNotificationRealtime from '../hooks/useNotificationRealtime'

const NotificationContext = createContext()
const MAX_TOASTS = 4

function dedupeNotifications(items = []) {
  const seen = new Set()
  return items.filter((item) => {
    const key = item?._id
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [toasts, setToasts] = useState([])

  const enabled = Boolean(user)

  const loadNotifications = useCallback(async ({ unread = false, type = '' } = {}) => {
    if (!enabled) return

    const query = new URLSearchParams()
    query.set('limit', '20')
    if (unread) query.set('unread', 'true')
    if (type) query.set('type', type)

    setLoading(true)
    try {
      const { data } = await api.get(`/notifications?${query.toString()}`)
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } finally {
      setLoading(false)
    }
  }, [enabled])

  const loadSummary = useCallback(async () => {
    if (!enabled) return
    const { data } = await api.get('/notifications/summary')
    setUnreadCount(data.unreadCount || 0)
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      setNotifications([])
      setUnreadCount(0)
      setToasts([])
      return
    }

    loadNotifications().catch(() => null)
    loadSummary().catch(() => null)
  }, [enabled, loadNotifications, loadSummary])

  const dismissToast = useCallback((toastId) => {
    setToasts((previous) => previous.filter((toast) => toast.toastId !== toastId))
  }, [])

  const addToast = useCallback((notification) => {
    if (!notification?._id) return

    const toastId = `${notification._id}-${Date.now()}`
    setToasts((previous) => [
      { ...notification, toastId },
      ...previous.filter((toast) => toast._id !== notification._id)
    ].slice(0, MAX_TOASTS))

    window.setTimeout(() => dismissToast(toastId), 6000)
  }, [dismissToast])

  const handleRealtimeEvent = useCallback((eventName, payload) => {
    if (eventName === 'notification:new' && payload?.notification) {
      const nextNotification = payload.notification
      setNotifications((previous) => dedupeNotifications([nextNotification, ...previous]).slice(0, 30))
      setUnreadCount(payload.unreadCount ?? 0)
      addToast(nextNotification)
    }

    if (eventName === 'notification:summaryUpdated') {
      setUnreadCount(payload?.unreadCount ?? 0)
    }
  }, [addToast])

  useNotificationRealtime({ enabled, onEvent: handleRealtimeEvent })

  const markRead = useCallback(async (notificationId) => {
    if (!notificationId) return null
    const { data } = await api.patch(`/notifications/${notificationId}/read`)
    setNotifications((previous) => previous.map((item) => (
      item._id === notificationId ? { ...item, isRead: true, readAt: data.notification?.readAt || new Date().toISOString() } : item
    )))
    setUnreadCount(data.unreadCount || 0)
    return data.notification
  }, [])

  const markAllRead = useCallback(async () => {
    const { data } = await api.patch('/notifications/read-all')
    setNotifications((previous) => previous.map((item) => ({
      ...item,
      isRead: true,
      readAt: item.readAt || new Date().toISOString()
    })))
    setUnreadCount(data.unreadCount || 0)
    return data
  }, [])

  const deleteNotification = useCallback(async (notificationId) => {
    if (!notificationId) return null
    const { data } = await api.delete(`/notifications/${notificationId}`)
    setNotifications((previous) => previous.filter((item) => item._id !== notificationId))
    setUnreadCount(data.unreadCount || 0)
    return data
  }, [])

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    loading,
    toasts,
    loadNotifications,
    loadSummary,
    markRead,
    markAllRead,
    deleteNotification,
    dismissToast
  }), [
    notifications,
    unreadCount,
    loading,
    toasts,
    loadNotifications,
    loadSummary,
    markRead,
    markAllRead,
    deleteNotification,
    dismissToast
  ])

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}
