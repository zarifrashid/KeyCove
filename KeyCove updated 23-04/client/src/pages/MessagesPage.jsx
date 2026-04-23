import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ConversationList from '../components/chat/ConversationList'
import ChatWindow from '../components/chat/ChatWindow'
import { useAuth } from '../context/AuthContext'
import useChatRealtime from '../hooks/useChatRealtime'
import { api } from '../lib/api'

function orderConversations(items) {
  return [...items].sort((first, second) => new Date(second.lastMessageAt || 0) - new Date(first.lastMessageAt || 0))
}

export default function MessagesPage() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [activeConversationId, setActiveConversationId] = useState('')
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [pageError, setPageError] = useState('')
  const [unreadTotal, setUnreadTotal] = useState(0)

  const selectedConversationIdFromQuery = useMemo(() => new URLSearchParams(location.search).get('conversation') || '', [location.search])
  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation._id === activeConversationId) || null,
    [activeConversationId, conversations]
  )

  const updateConversationInList = useCallback((updatedConversation) => {
    if (!updatedConversation?._id) return
    setConversations((previous) => {
      const existing = previous.find((item) => item._id === updatedConversation._id)
      const next = existing
        ? previous.map((item) => (item._id === updatedConversation._id ? { ...item, ...updatedConversation } : item))
        : [updatedConversation, ...previous]
      return orderConversations(next)
    })
  }, [])

  const fetchConversations = useCallback(async () => {
    try {
      setLoadingConversations(true)
      const [conversationResponse, unreadResponse] = await Promise.all([
        api.get('/chat/conversations'),
        api.get('/chat/unread-summary')
      ])

      const nextConversations = orderConversations(conversationResponse.data.conversations || [])
      setConversations(nextConversations)
      setUnreadTotal(unreadResponse.data.unreadTotal || 0)

      const preferredConversationId = selectedConversationIdFromQuery || nextConversations[0]?._id || ''
      setActiveConversationId(preferredConversationId)
      setPageError('')
    } catch (error) {
      setPageError(error.response?.data?.message || 'Failed to load messages.')
    } finally {
      setLoadingConversations(false)
    }
  }, [selectedConversationIdFromQuery])

  const fetchMessages = useCallback(async (conversationId) => {
    if (!conversationId) {
      setMessages([])
      return
    }

    try {
      setLoadingMessages(true)
      const { data } = await api.get(`/chat/conversations/${conversationId}/messages`)
      setMessages(data.messages || [])
      if (data.conversation) {
        updateConversationInList(data.conversation)
      }
      await api.patch(`/chat/conversations/${conversationId}/read`)
    } catch (error) {
      setPageError(error.response?.data?.message || 'Failed to load conversation messages.')
    } finally {
      setLoadingMessages(false)
    }
  }, [updateConversationInList])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (!activeConversationId) return
    fetchMessages(activeConversationId)
  }, [activeConversationId, fetchMessages])

  useEffect(() => {
    if (!selectedConversationIdFromQuery) return
    setActiveConversationId(selectedConversationIdFromQuery)
  }, [selectedConversationIdFromQuery])

  const handleRealtimeEvent = useCallback((eventName, payload) => {
    if (eventName === 'chat:conversationUpdated' && payload.conversation) {
      updateConversationInList(payload.conversation)
      if (payload.conversation._id === activeConversationId) {
        setActiveConversationId(payload.conversation._id)
      }
    }

    if (eventName === 'chat:newMessage' && payload.conversationId && payload.message) {
      if (payload.conversationId === activeConversationId) {
        setMessages((previous) => {
          if (previous.some((item) => item._id === payload.message._id)) return previous
          return [...previous, payload.message]
        })
      }
    }

    if (eventName === 'chat:unreadSummaryUpdated' && typeof payload.unreadTotal === 'number') {
      fetchConversations()
    }

    if (eventName === 'chat:messagesRead' && payload.conversationId === activeConversationId) {
      setConversations((previous) => previous.map((item) => (
        item._id === payload.conversationId ? { ...item, unreadCount: 0 } : item
      )))
    }
  }, [activeConversationId, fetchConversations, updateConversationInList])

  useChatRealtime({ enabled: Boolean(user), onEvent: handleRealtimeEvent })

  const handleSelectConversation = (conversation) => {
    setActiveConversationId(conversation._id)
    const params = new URLSearchParams(location.search)
    params.set('conversation', conversation._id)
    navigate(`/messages?${params.toString()}`, { replace: true })
  }

  const handleSend = async (content) => {
    if (!activeConversationId) return false

    try {
      setSending(true)
      const { data } = await api.post(`/chat/conversations/${activeConversationId}/messages`, { content })
      setMessages((previous) => (
        previous.some((item) => item._id === data.message._id) ? previous : [...previous, data.message]
      ))
      return true
    } catch (error) {
      setPageError(error.response?.data?.message || 'Failed to send message.')
      return false
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Navbar unreadMessages={unreadTotal} />
      <div className="page-wrap messages-page-wrap">
        <div className="messages-page-shell card">
          <div className="messages-page-sidebar">
            <div className="messages-page-sidebar-header">
              <div>
                <p className="badge">Messages</p>
                <h2>{user?.role === 'manager' ? 'Tenant conversations' : 'Manager conversations'}</h2>
              </div>
              <span className="chat-total-badge">Unread: {unreadTotal}</span>
            </div>
            {pageError ? <p className="error-text">{pageError}</p> : null}
            <ConversationList
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={handleSelectConversation}
              loading={loadingConversations}
            />
          </div>

          <div className="messages-page-main">
            <ChatWindow
              conversation={activeConversation}
              messages={messages}
              currentUserId={user?.id}
              loading={loadingMessages}
              sending={sending}
              onSend={handleSend}
            />
          </div>
        </div>
      </div>
    </>
  )
}
