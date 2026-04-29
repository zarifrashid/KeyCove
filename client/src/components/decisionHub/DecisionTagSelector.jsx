import { DECISION_TAG_OPTIONS } from '../../lib/decisionHub'

export default function DecisionTagSelector({ value = [], onChange }) {
  const selected = new Set(Array.isArray(value) ? value : [])

  const toggleTag = (tag) => {
    const next = new Set(selected)
    if (next.has(tag)) next.delete(tag)
    else next.add(tag)
    onChange?.([...next])
  }

  return (
    <div className="decision-tag-selector">
      {DECISION_TAG_OPTIONS.map((tag) => (
        <button
          key={tag.value}
          type="button"
          className={`decision-tag-chip ${selected.has(tag.value) ? 'selected' : ''}`}
          onClick={() => toggleTag(tag.value)}
        >
          {tag.label}
        </button>
      ))}
    </div>
  )
}
