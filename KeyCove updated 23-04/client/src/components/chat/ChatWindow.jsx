import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import EmptyChatState from './EmptyChatState'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'

export default function ChatWindow({ conversation, messages, currentUserId, loading, sending, onSend }) {
  const messageEndRef = useRef(null)

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, conversation?._id])

  if (!conversation) {
    return <EmptyChatState />
  }

  return (
    <div className="chat-window-shell">
      <div className="chat-window-header">
        <div>
          <h2>{conversation.otherUser?.name || 'Conversation'}</h2>
          <p>
            {conversation.property?.title || 'Property chat'}
            {conversation.property?._id ? (
              <>
                {' '}
                · <Link to={`/properties/${conversation.property._id}`}>View Property</Link>
              </>
            ) : null}
          </p>
        </div>
        <div className="chat-window-header-meta">
          <span>{conversation.otherUser?.email || ''}</span>
        </div>
      </div>

      <div className="chat-message-list">
        {loading ? <div className="chat-thread-status">Loading messages...</div> : null}
        {!loading && !messages.length ? (
          <div className="chat-thread-status">No messages yet. Start the conversation.</div>
        ) : null}
        {messages.map((message) => (
          <MessageBubble
            key={message._id}
            message={message}
            isOwn={(message.sender?._id || message.sender) === currentUserId}
          />
        ))}
        <div ref={messageEndRef} />
      </div>

      <MessageInput disabled={sending} onSend={onSend} />
    </div>
  )
}
