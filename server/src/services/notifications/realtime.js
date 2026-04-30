const userStreams = new Map()

function writeEvent(res, event, payload) {
  res.write(`event: ${event}\n`)
  res.write(`data: ${JSON.stringify(payload)}\n\n`)
}

export function registerNotificationStream(userId, res) {
  const key = String(userId)
  if (!userStreams.has(key)) userStreams.set(key, new Set())
  userStreams.get(key).add(res)

  writeEvent(res, 'notification:connected', {
    ok: true,
    userId: key,
    timestamp: new Date().toISOString()
  })
}

export function removeNotificationStream(userId, res) {
  const key = String(userId)
  const streams = userStreams.get(key)
  if (!streams) return

  streams.delete(res)
  if (!streams.size) userStreams.delete(key)
}

export function emitNotificationToUser(userId, event, payload) {
  const streams = userStreams.get(String(userId))
  if (!streams?.size) return

  for (const res of streams) {
    writeEvent(res, event, payload)
  }
}

export function emitNotificationToUsers(userIds, event, payload) {
  const seen = new Set()
  for (const userId of userIds || []) {
    if (!userId) continue
    const key = String(userId)
    if (seen.has(key)) continue
    seen.add(key)
    emitNotificationToUser(key, event, payload)
  }
}
