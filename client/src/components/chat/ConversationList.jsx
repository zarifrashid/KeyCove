import ConversationListItem from './ConversationListItem'

export default function ConversationList({ conversations, activeConversationId, onSelectConversation, loading }) {
  if (loading) {
    return <div className="chat-sidebar-empty">Loading conversations...</div>
  }

  if (!conversations.length) {
    return (
      <div className="chat-sidebar-empty">
        <h3>No conversations yet</h3>
        <p>Open a property and press Contact Manager to start a chat.</p>
      </div>
    )
  }

  return (
    <div className="chat-conversation-list">
      {conversations.map((conversation) => (
        <ConversationListItem
          key={conversation._id}
          conversation={conversation}
          isActive={activeConversationId === conversation._id}
          onClick={() => onSelectConversation(conversation)}
        />
      ))}
    </div>
  )
}
