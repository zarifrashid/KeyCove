import { buildDefaultChecklist } from '../../lib/decisionHub'

export default function VisitChecklist({ checklist = [], onChange }) {
  const rows = buildDefaultChecklist(checklist)

  const updateItem = (index, patch) => {
    const next = rows.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
    onChange?.(next)
  }

  return (
    <div className="visit-checklist">
      {rows.map((item, index) => (
        <label key={item.label} className={`visit-check-item ${item.checked ? 'checked' : ''}`}>
          <div className="visit-check-line">
            <input
              type="checkbox"
              checked={Boolean(item.checked)}
              onChange={(event) => updateItem(index, { checked: event.target.checked })}
            />
            <span>{item.label}</span>
          </div>
          <input
            type="text"
            value={item.note || ''}
            onChange={(event) => updateItem(index, { note: event.target.value })}
            placeholder="Optional note..."
          />
        </label>
      ))}
    </div>
  )
}
