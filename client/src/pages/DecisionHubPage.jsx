import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import DecisionNotePanel from '../components/decisionHub/DecisionNotePanel'
import PropertyComparisonBoard from '../components/decisionHub/PropertyComparisonBoard'
import TrustBadge from '../components/decisionHub/TrustBadge'
import { api } from '../lib/api'
import { formatCurrency, getPropertyImage, getVisitStatusLabel, normalizeDecisionItem } from '../lib/decisionHub'

function DecisionStatCard({ label, value, hint }) {
  return (
    <article className="decision-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </article>
  )
}

export default function DecisionHubPage() {
  const [items, setItems] = useState([])
  const [compareItems, setCompareItems] = useState([])
  const [status, setStatus] = useState({ loading: true, error: '' })
  const [expandedNoteId, setExpandedNoteId] = useState('')

  const loadHub = useCallback(async () => {
    try {
      setStatus({ loading: true, error: '' })
      const [notesResponse, compareResponse] = await Promise.all([
        api.get('/decision-hub'),
        api.get('/decision-hub/compare/list')
      ])
      setItems((notesResponse.data.items || []).map(normalizeDecisionItem))
      setCompareItems((compareResponse.data.items || []).map(normalizeDecisionItem))
      setStatus({ loading: false, error: '' })
    } catch (error) {
      setStatus({ loading: false, error: error.response?.data?.message || 'Failed to load Decision Hub.' })
    }
  }, [])

  useEffect(() => {
    loadHub()
  }, [loadHub])

  const stats = useMemo(() => {
    const noteItems = items.map((item) => item.note)
    return {
      shortlisted: noteItems.filter((note) => note.visitStatus === 'shortlisted' || note.decisionTags?.includes('final_choice')).length,
      scheduled: noteItems.filter((note) => note.visitStatus === 'scheduled').length,
      visited: noteItems.filter((note) => note.visitStatus === 'visited').length,
      finalChoice: noteItems.filter((note) => note.visitStatus === 'final_choice' || note.decisionTags?.includes('final_choice')).length
    }
  }, [items])

  return (
    <>
      <Navbar />
      <main className="decision-hub-wrap">
        <section className="decision-hero-card">
          <div>
            <p className="decision-eyebrow">KeyCove Decision Hub</p>
            <h1>Move from browsing to choosing the right home.</h1>
            <p>
              Save inspection notes, compare your strongest properties, and use listing trust signals to make a confident rental decision.
            </p>
            <div className="decision-hero-actions">
              <Link to="/explore" className="primary-btn">Browse Properties</Link>
              <a href="#comparison" className="secondary-btn">Open Comparison</a>
            </div>
          </div>
          <div className="decision-hero-panel">
            <span>Decision workflow</span>
            <strong>Inspect → Compare → Decide</strong>
            <p>Built around real tenant behavior: visits, notes, questions, trust signals, and final choice.</p>
          </div>
        </section>

        <section className="decision-stats-grid">
          <DecisionStatCard label="Shortlisted" value={stats.shortlisted} hint="Properties still in the race" />
          <DecisionStatCard label="Scheduled Visits" value={stats.scheduled} hint="Need real inspection" />
          <DecisionStatCard label="Visited" value={stats.visited} hint="Ready for serious comparison" />
          <DecisionStatCard label="Final Choice" value={stats.finalChoice} hint="Your strongest decision" />
        </section>

        {status.loading ? <p className="muted-text">Loading Decision Hub...</p> : null}
        {status.error ? <p className="error-text">{status.error}</p> : null}

        {!status.loading && !status.error ? (
          <div className="decision-hub-shell">
            <div id="comparison">
              <PropertyComparisonBoard items={compareItems} onChanged={loadHub} />
            </div>

            <section className="decision-notes-section">
              <div className="decision-section-head">
                <div>
                  <p className="decision-eyebrow">Saved Decision Notes</p>
                  <h2>Your shortlisted properties and visit memory</h2>
                </div>
                <span>{items.length} saved</span>
              </div>

              {!items.length ? (
                <div className="comparison-empty-state">
                  <h3>No Decision Hub notes yet.</h3>
                  <p>Open any property details page and add it to compare or save private visit notes.</p>
                  <Link to="/explore" className="primary-btn">Start exploring</Link>
                </div>
              ) : (
                <div className="decision-note-card-grid">
                  {items.map((item) => {
                    const property = item.property
                    const note = item.note
                    const isOpen = expandedNoteId === property._id
                    return (
                      <article key={property._id} className="decision-note-summary-card">
                        <img src={getPropertyImage(property)} alt={property.imageAlt || property.title} />
                        <div className="decision-note-summary-body">
                          <div className="decision-note-topline">
                            <span>{getVisitStatusLabel(note.visitStatus)}</span>
                            <TrustBadge trust={item.trustBadge} property={property} compact />
                          </div>
                          <h3>{property.title}</h3>
                          <p>{[property.location?.address, property.location?.area, property.location?.city].filter(Boolean).join(', ')}</p>
                          <strong>{formatCurrency(property.price, property.listingType)}</strong>
                          <div className="decision-note-preview-grid">
                            <span>{note.personalRating ? `${note.personalRating} ★ rating` : 'No rating yet'}</span>
                            <span>{note.compareSelected ? 'In comparison' : 'Not comparing'}</span>
                            <span>{item.designRoomsAvailable ? 'Design Rooms Available' : 'No room design yet'}</span>
                          </div>
                          <div className="decision-summary-actions">
                            <Link to={`/properties/${property._id}`} className="secondary-btn">View Details</Link>
                            <button type="button" className="primary-btn" onClick={() => setExpandedNoteId(isOpen ? '' : property._id)}>
                              {isOpen ? 'Hide Notes' : 'Update Notes'}
                            </button>
                          </div>
                          {isOpen ? (
                            <DecisionNotePanel
                              propertyId={property._id}
                              initialNote={note}
                              compact
                              onSaved={loadHub}
                            />
                          ) : null}
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </main>
    </>
  )
}
