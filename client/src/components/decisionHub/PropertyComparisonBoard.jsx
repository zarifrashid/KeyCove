import { Fragment, useMemo, useState } from 'react'
import { api } from '../../lib/api'
import { formatCurrency, formatDate, getDecisionTagLabel, getVisitStatusLabel, normalizeDecisionItem } from '../../lib/decisionHub'
import ComparePropertyCard from './ComparePropertyCard'
import TrustBadge from './TrustBadge'

function statusText(status) {
  if (!status || status === 'not_applied') return 'Not Applied'
  return String(status).replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function yesNo(value) {
  return value ? 'Yes' : 'No'
}

export default function PropertyComparisonBoard({ items = [], onChanged }) {
  const [busyId, setBusyId] = useState('')
  const normalizedItems = useMemo(() => items.map(normalizeDecisionItem), [items])

  const updateNote = async (item, patch) => {
    const propertyId = item.property?._id
    if (!propertyId) return
    try {
      setBusyId(propertyId)
      await api.post(`/decision-hub/${propertyId}`, {
        visitStatus: patch.visitStatus || item.note.visitStatus,
        personalRating: item.note.personalRating || null,
        pros: item.note.pros || '',
        cons: item.note.cons || '',
        questionsForManager: item.note.questionsForManager || '',
        privateNotes: item.note.privateNotes || '',
        checklist: item.note.checklist || [],
        decisionTags: patch.decisionTags || item.note.decisionTags || [],
        compareSelected: patch.compareSelected ?? item.note.compareSelected
      })
      onChanged?.()
    } finally {
      setBusyId('')
    }
  }

  const removeFromCompare = async (item) => {
    const propertyId = item.property?._id
    if (!propertyId) return
    try {
      setBusyId(propertyId)
      await api.patch(`/decision-hub/${propertyId}/compare`, { compareSelected: false })
      onChanged?.()
    } finally {
      setBusyId('')
    }
  }

  const markFinalChoice = (item) => updateNote(item, {
    visitStatus: 'final_choice',
    decisionTags: [...new Set([...(item.note.decisionTags || []).filter((tag) => tag !== 'rejected'), 'final_choice'])],
    compareSelected: true
  })

  const rejectProperty = (item) => updateNote(item, {
    visitStatus: 'rejected',
    decisionTags: [...new Set([...(item.note.decisionTags || []).filter((tag) => tag !== 'final_choice'), 'rejected'])],
    compareSelected: false
  })

  if (normalizedItems.length < 2) {
    return (
      <section className="comparison-board comparison-empty-state">
        <p className="decision-eyebrow">Smart Property Comparison Board</p>
        <h2>Select at least two properties to compare.</h2>
        <p>Add properties from a listing card or property details page. You can compare up to 4 properties at a time.</p>
      </section>
    )
  }

  const rows = [
    { label: 'Rent / Price', render: (item) => formatCurrency(item.property.price, item.property.listingType) },
    { label: 'Location', render: (item) => [item.property.location?.address, item.property.location?.area, item.property.location?.city].filter(Boolean).join(', ') || 'Not listed' },
    { label: 'Bedrooms', render: (item) => item.property.bedrooms ?? 'Not listed' },
    { label: 'Bathrooms', render: (item) => item.property.bathrooms ?? 'Not listed' },
    { label: 'Square Feet', render: (item) => item.property.squareFeet ? `${item.property.squareFeet} sqft` : 'Not listed' },
    { label: 'Property Type', render: (item) => item.property.propertyType || 'Not listed' },
    { label: 'Availability / Status', render: (item) => item.property.status || 'Not listed' },
    { label: 'Amenities', render: (item) => item.property.amenities?.length ? item.property.amenities.join(', ') : 'None listed' },
    { label: 'Trust Badge', render: (item) => <TrustBadge trust={item.trustBadge} property={item.property} compact /> },
    { label: 'Listing Quality Score', render: (item) => `${item.trustBadge?.score || 0}%` },
    { label: 'Manager Verification', render: (item) => yesNo(item.trustBadge?.managerVerified) },
    { label: 'Images', render: (item) => yesNo((item.trustBadge?.breakdown?.images?.score || 0) > 0) },
    { label: 'Room Dimensions', render: (item) => yesNo(item.trustBadge?.hasRoomDimensions) },
    { label: 'Design Rooms Layout', render: (item) => item.designRoomsAvailable || item.trustBadge?.hasDesignRoomsLayout ? 'Design Rooms Available' : 'No room design added yet' },
    { label: 'Visit Status', render: (item) => getVisitStatusLabel(item.note.visitStatus) },
    { label: 'Personal Rating', render: (item) => item.note.personalRating ? `${item.note.personalRating} ★` : 'No rating' },
    { label: 'Decision Tags', render: (item) => item.note.decisionTags?.length ? item.note.decisionTags.map(getDecisionTagLabel).join(', ') : 'No tags yet' },
    { label: 'Pros', render: (item) => item.note.pros || 'No pros recorded' },
    { label: 'Cons', render: (item) => item.note.cons || 'No cons recorded' },
    { label: 'Application Status', render: (item) => statusText(item.applicationStatus?.status) },
    { label: 'Last Updated', render: (item) => formatDate(item.property.updatedAt) }
  ]

  return (
    <section className="comparison-board">
      <div className="comparison-board-head">
        <div>
          <p className="decision-eyebrow">Smart Property Comparison Board</p>
          <h2>Compare your strongest choices side by side</h2>
          <p>Use trust signals, visit notes, and Design Rooms availability to make a confident final decision.</p>
        </div>
        <span>{normalizedItems.length} / 4 selected</span>
      </div>

      <div className="compare-card-grid">
        {normalizedItems.map((item) => (
          <ComparePropertyCard
            key={item.property._id}
            item={item}
            onRemove={removeFromCompare}
            onFinalChoice={markFinalChoice}
            onReject={rejectProperty}
            disabled={busyId === item.property._id}
          />
        ))}
      </div>

      <div className="comparison-matrix" style={{ '--compare-columns': normalizedItems.length }}>
        <div className="comparison-row comparison-row-header">
          <div className="comparison-label-cell">Decision Factor</div>
          {normalizedItems.map((item) => <div key={item.property._id} className="comparison-value-cell sticky-cell">{item.property.title}</div>)}
        </div>
        {rows.map((row) => (
          <Fragment key={row.label}>
            <div className="comparison-row">
              <div className="comparison-label-cell">{row.label}</div>
              {normalizedItems.map((item) => (
                <div key={`${item.property._id}-${row.label}`} className="comparison-value-cell">
                  {row.render(item)}
                </div>
              ))}
            </div>
          </Fragment>
        ))}
      </div>

      <div className="comparison-final-controls">
        <strong>Final decision tip:</strong>
        <span>Pick the property with the best balance of real inspection notes, trust score, budget fit, and layout confidence.</span>
      </div>
    </section>
  )
}
