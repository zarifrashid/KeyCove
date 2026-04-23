export function isConversationParticipant(conversation, userId) {
  if (!conversation || !userId) return false
  const tenantId = conversation.tenant?._id ? conversation.tenant._id.toString() : conversation.tenant?.toString?.()
  const managerId = conversation.manager?._id ? conversation.manager._id.toString() : conversation.manager?.toString?.()
  return tenantId === userId || managerId === userId
}

export function getViewerRoleInConversation(conversation, userId) {
  const tenantId = conversation.tenant?._id ? conversation.tenant._id.toString() : conversation.tenant?.toString?.()
  const managerId = conversation.manager?._id ? conversation.manager._id.toString() : conversation.manager?.toString?.()

  if (tenantId === userId) return 'tenant'
  if (managerId === userId) return 'manager'
  return null
}
