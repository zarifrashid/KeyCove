export default function ApplicationModeSelector({ actionType = 'rent', onSelect }) {
  return (
    <div className="roommate-selector-card">
      <p className="badge">Application Method</p>
      <h2>How do you want to apply for this property?</h2>
      <p className="roommate-muted">
        Apply alone with the existing KeyCove form, or build a shared {actionType} application with roommates.
      </p>
      <div className="roommate-choice-grid">
        <button type="button" className="roommate-choice-card" onClick={() => onSelect?.('alone')}>
          <strong>Apply Alone</strong>
          <span>Use the current solo application flow.</span>
        </button>
        <button type="button" className="roommate-choice-card roommate-choice-card--primary" onClick={() => onSelect?.('roommates')}>
          <strong>Apply With Roommates</strong>
          <span>Create or join a shared application.</span>
        </button>
      </div>
    </div>
  )
}
