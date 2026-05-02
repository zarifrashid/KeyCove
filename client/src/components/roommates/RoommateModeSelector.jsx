export default function RoommateModeSelector({ onSelect, onBack }) {
  return (
    <div className="roommate-selector-card">
      <p className="badge">Roommate Setup</p>
      <h2>Do you already know your roommates?</h2>
      <p className="roommate-muted">
        Invite friends you already know, or find tenants who are looking for roommates for this same property.
      </p>
      <div className="roommate-choice-grid">
        <button type="button" className="roommate-choice-card" onClick={() => onSelect?.('known')}>
          <strong>Yes, I know them</strong>
          <span>Invite registered tenants or add manual roommate details.</span>
        </button>
        <button type="button" className="roommate-choice-card roommate-choice-card--primary" onClick={() => onSelect?.('unknown')}>
          <strong>No, help me find roommates</strong>
          <span>Browse groups or start a new roommate search group.</span>
        </button>
      </div>
      <button type="button" className="secondary-btn roommate-back-btn" onClick={onBack}>Back</button>
    </div>
  )
}
