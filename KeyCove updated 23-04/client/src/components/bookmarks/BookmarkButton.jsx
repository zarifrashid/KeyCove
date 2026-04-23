export default function BookmarkButton({
  isSaved = false,
  onToggle,
  disabled = false,
  busy = false,
  className = '',
  savedLabel = 'Saved',
  unsavedLabel = 'Save'
}) {
  const label = busy ? 'Saving...' : isSaved ? savedLabel : unsavedLabel

  return (
    <button
      type="button"
      className={`secondary-btn bookmark-btn ${isSaved ? 'is-saved' : ''} ${className}`.trim()}
      onClick={onToggle}
      disabled={disabled || busy}
      aria-pressed={isSaved}
    >
      <span className="bookmark-btn-icon" aria-hidden="true">{isSaved ? '★' : '☆'}</span>
      <span>{label}</span>
    </button>
  )
}
