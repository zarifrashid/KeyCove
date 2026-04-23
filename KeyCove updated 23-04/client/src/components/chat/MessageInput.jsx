import { useState } from 'react'

export default function MessageInput({ disabled, onSend }) {
  const [content, setContent] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmed = content.trim()
    if (!trimmed || disabled) return

    const success = await onSend(trimmed)
    if (success !== false) {
      setContent('')
    }
  }

  return (
    <form className="chat-input-row" onSubmit={handleSubmit}>
      <textarea
        className="chat-input"
        rows={2}
        placeholder="Write a message..."
        value={content}
        disabled={disabled}
        onChange={(event) => setContent(event.target.value)}
      />
      <button type="submit" className="primary-btn" disabled={disabled || !content.trim()}>
        {disabled ? 'Sending...' : 'Send'}
      </button>
    </form>
  )
}
