export default function BoardTabs({ activeTab, onChange }) {
  const tabs = [
    { id: 'properties', label: 'Properties' },
    { id: 'members', label: 'Members' },
    { id: 'activity', label: 'Activity' }
  ]

  return (
    <div className="shared-board-tab-row">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`shared-board-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
