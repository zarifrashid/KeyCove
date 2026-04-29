import { useMemo, useState } from 'react'
import { calculateLocalTrustBadge } from '../../lib/decisionHub'

export default function TrustBadge({ property, trust, compact = false, expandedDefault = false }) {
  const [expanded, setExpanded] = useState(expandedDefault)
  const badge = useMemo(() => trust || calculateLocalTrustBadge(property || {}), [property, trust])
  const breakdownRows = Object.entries(badge.breakdown || {})

  return (
    <div className={`trust-badge-wrap ${compact ? 'compact' : ''}`}>
      <button
        type="button"
        className={`trust-badge trust-${badge.level || 'incomplete'}`}
        onClick={(event) => {
          event.stopPropagation()
          setExpanded((previous) => !previous)
        }}
        aria-expanded={expanded}
      >
        <span className="trust-dot" aria-hidden="true" />
        <span>{badge.label || 'Incomplete Listing'}</span>
        <strong>{Number(badge.score || 0)}%</strong>
      </button>

      {expanded ? (
        <div className="trust-breakdown-card" onClick={(event) => event.stopPropagation()}>
          <div className="trust-breakdown-head">
            <strong>Listing Quality Breakdown</strong>
            <span>{Number(badge.score || 0)} / 100</span>
          </div>
          <div className="trust-breakdown-rows">
            {breakdownRows.map(([key, row]) => (
              <div key={key} className="trust-breakdown-row">
                <span>{row.label}</span>
                <strong>{row.score}/{row.max}</strong>
              </div>
            ))}
          </div>
          {badge.positives?.length ? (
            <div className="trust-signal-list positive">
              <span>Strong signals</span>
              {badge.positives.slice(0, 5).map((item) => <small key={item}>✓ {item}</small>)}
            </div>
          ) : null}
          {badge.missing?.length ? (
            <div className="trust-signal-list missing">
              <span>Missing</span>
              {badge.missing.slice(0, 5).map((item) => <small key={item}>• {item}</small>)}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
