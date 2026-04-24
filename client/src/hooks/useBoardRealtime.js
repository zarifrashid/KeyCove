import { useEffect } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function useBoardRealtime({ enabled = true, onEvent }) {
  useEffect(() => {
    if (!enabled || typeof onEvent !== 'function') return undefined

    const streamUrl = `${API_BASE_URL}/boards/stream`
    const eventSource = new EventSource(streamUrl, { withCredentials: true })
    const eventNames = [
      'board:connected',
      'board:inviteReceived',
      'board:inviteUpdated',
      'board:itemAdded',
      'board:commentAdded',
      'board:voteUpdated',
      'board:activityUpdated',
      'board:boardUpdated',
      'board:summaryUpdated',
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
      listeners.forEach(({ eventName, handler }) => eventSource.removeEventListener(eventName, handler))
      eventSource.close()
    }
  }, [enabled, onEvent])
}
