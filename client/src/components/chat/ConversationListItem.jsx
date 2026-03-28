function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  return date.toLocaleString('en-BD', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

export default function ConversationListItem({ conversation, isActive, onClick }) {
  const previewImage = conversation.property?.image || conversation.property?.images?.[0]?.url || '/auth-city.jpg'

  return (
    <button type="button" className={`chat-conversation-item ${isActive ? 'active' : ''}`} onClick={onClick}>
      <img src={previewImage} alt={conversation.property?.title || 'Property'} className="chat-conversation-thumb" />
      <div className="chat-conversation-main">
        <div className="chat-conversation-topline">
          <strong>{conversation.otherUser?.name || 'Conversation'}</strong>
          <span>{formatTime(conversation.lastMessageAt)}</span>
        </div>
        <div className="chat-conversation-property">{conversation.property?.title || 'Property chat'}</div>
        <div className="chat-conversation-preview-row">
          <p>{conversation.lastMessageText || 'Start your conversation here.'}</p>
          {conversation.unreadCount ? <span className="chat-unread-badge">{conversation.unreadCount}</span> : null}
        </div>
      </div>
    </button>
  )
}
