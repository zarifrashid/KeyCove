export default function BookmarkButton({
  isSaved,
  onToggle,
  disabled = false,
  loading = false,
  className = '',
  compact = false
}) {
  const label = loading ? (isSaved ? 'Removing...' : 'Saving...') : (isSaved ? 'Saved' : 'Save')

  return (
    <button
      type="button"
      className={`secondary-btn bookmark-btn ${isSaved ? 'saved' : ''} ${compact ? 'compact' : ''} ${className}`.trim()}
      onClick={onToggle}
      disabled={disabled || loading}
      aria-pressed={isSaved}
    >
      <span className="bookmark-btn-icon" aria-hidden="true">{isSaved ? '♥' : '♡'}</span>
      <span>{label}</span>
    </button>
  )
}
