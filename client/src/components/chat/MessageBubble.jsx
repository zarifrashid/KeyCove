function formatTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('en-BD', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

export default function MessageBubble({ message, isOwn }) {
  return (
    <div className={`chat-message-row ${isOwn ? 'own' : ''}`}>
      <div className={`chat-message-bubble ${isOwn ? 'own' : ''}`}>
        {!isOwn ? <div className="chat-message-sender">{message.sender?.name || 'User'}</div> : null}
        <p>{message.content}</p>
        <span>{formatTime(message.sentAt || message.createdAt)}</span>
      </div>
    </div>
  )
}
