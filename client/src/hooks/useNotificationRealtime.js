import { useEffect } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function useNotificationRealtime({ enabled = true, onEvent }) {
  useEffect(() => {
    if (!enabled || typeof onEvent !== 'function') return undefined

    const eventSource = new EventSource(`${API_BASE_URL}/notifications/stream`, {
      withCredentials: true
    })

    const eventNames = [
      'notification:connected',
      'notification:new',
      'notification:summaryUpdated',
      'ping'
    ]

    const listeners = eventNames.map((eventName) => {
      const handler = (event) => {
        try {
          onEvent(eventName, JSON.parse(event.data || '{}'))
        } catch (_) {
          onEvent(eventName, {})
        }
      }

      eventSource.addEventListener(eventName, handler)
      return { eventName, handler }
    })

    return () => {
      listeners.forEach(({ eventName, handler }) => {
        eventSource.removeEventListener(eventName, handler)
      })
      eventSource.close()
    }
  }, [enabled, onEvent])
}
