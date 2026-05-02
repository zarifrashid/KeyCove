import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'

function formatMoney(value, suffix = '') {
  const amount = `৳ ${Number(value || 0).toLocaleString()}`
  return suffix ? `${amount} ${suffix}` : amount
}

function emptyRoommate() {
  return {
    mode: 'manual',
    userId: '',
    name: '',
    email: '',
    phone: '',
    occupation: '',
    monthlyIncome: '',
    employmentStatus: '',
    employerName: '',
    currentAddress: '',
    additionalInfo: '',
    relationshipToCreator: '',
    expectedContribution: '',
    searchResults: [],
    searchLoading: false
  }
}

export default function KnownRoommateForm({ property, actionType, leaseMonths, onBack }) {
  const navigate = useNavigate()
  const [targetGroupSize, setTargetGroupSize] = useState(2)
  const [localLeaseMonths, setLocalLeaseMonths] = useState(leaseMonths || '12')
  const [moveInDate, setMoveInDate] = useState('')
  const [introMessage, setIntroMessage] = useState('')
  const [messageToManager, setMessageToManager] = useState('')
  const [roommates, setRoommates] = useState([emptyRoommate()])
  const [state, setState] = useState({ submitting: false, error: '', success: '' })

  const monthlyRent = Number(property?.rentPrice || property?.price || 0)
  const rentPerPerson = useMemo(() => Math.ceil(monthlyRent / Number(targetGroupSize || 1)), [monthlyRent, targetGroupSize])

  const updateGroupSize = (value) => {
    const size = Math.max(2, Number(value || 2))
    setTargetGroupSize(size)
    setRoommates((previous) => {
      const needed = size - 1
      const next = [...previous]
      while (next.length < needed) next.push(emptyRoommate())
      return next.slice(0, needed)
    })
  }

  const updateRoommate = (index, field, value) => {
    setRoommates((previous) => previous.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    )))
  }

  const searchTenant = async (index) => {
    const query = roommates[index]?.email || roommates[index]?.name
    if (!query || query.trim().length < 2) return

    try {
      updateRoommate(index, 'searchLoading', true)
      const { data } = await api.get(`/roommate-groups/tenants/search?q=${encodeURIComponent(query)}`)
      setRoommates((previous) => previous.map((item, itemIndex) => (
        itemIndex === index ? { ...item, searchResults: data.tenants || [], searchLoading: false } : item
      )))
    } catch (_) {
      updateRoommate(index, 'searchLoading', false)
    }
  }

  const chooseTenant = (index, tenant) => {
    setRoommates((previous) => previous.map((item, itemIndex) => (
      itemIndex === index
        ? {
          ...item,
          mode: 'registered',
          userId: tenant._id,
          name: tenant.name || '',
          email: tenant.email || '',
          occupation: tenant.occupation || '',
          employmentStatus: tenant.employmentStatus || '',
          searchResults: []
        }
        : item
    )))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      setState({ submitting: true, error: '', success: '' })
      const payload = {
        propertyId: property._id,
        actionType,
        applicationMode: 'known_roommates',
        targetGroupSize: Number(targetGroupSize),
        leaseMonths: actionType === 'lease' ? Number(localLeaseMonths) : undefined,
        moveInDate: moveInDate || undefined,
        introMessage,
        messageToManager,
        roommates: roommates.map(({ searchResults, searchLoading, ...roommate }) => ({
          ...roommate,
          expectedContribution: Number(roommate.expectedContribution || rentPerPerson),
          monthlyIncome: roommate.monthlyIncome === '' ? undefined : Number(roommate.monthlyIncome)
        }))
      }
      const { data } = await api.post('/roommate-groups', payload)
      setState({ submitting: false, error: '', success: 'Known roommate application created.' })
      setTimeout(() => navigate(`/roommate-groups/${data.group?._id}`), 700)
    } catch (error) {
      setState({ submitting: false, error: error.response?.data?.message || 'Failed to create known roommate application.', success: '' })
    }
  }

  return (
    <form className="roommate-flow-card" onSubmit={handleSubmit}>
      <div className="roommate-section-header">
        <div>
          <p className="badge">Known Roommates</p>
          <h2>Create a shared {actionType} application</h2>
          <p>Add every roommate slot. Registered roommates get an invitation; manual roommates are saved as snapshots for the manager.</p>
        </div>
        <button type="button" className="secondary-btn" onClick={onBack}>Back</button>
      </div>

      {state.error ? <p className="error-text">{state.error}</p> : null}
      {state.success ? <p className="success-text">{state.success}</p> : null}

      <div className="roommate-form-grid">
        <label className="property-field">
          <span>Total people including me</span>
          <input type="number" min="2" value={targetGroupSize} onChange={(event) => updateGroupSize(event.target.value)} required />
        </label>
        {actionType === 'lease' ? (
          <label className="property-field">
            <span>Lease Months</span>
            <input type="number" min="1" value={localLeaseMonths} onChange={(event) => setLocalLeaseMonths(event.target.value)} required />
          </label>
        ) : null}
        <label className="property-field">
          <span>Move-in Date</span>
          <input type="date" value={moveInDate} onChange={(event) => setMoveInDate(event.target.value)} />
        </label>
        <div className="roommate-rent-pill">
          <span>Estimated per person</span>
          <strong>{formatMoney(rentPerPerson, '/ month')}</strong>
        </div>
      </div>

      <label className="property-field full-width">
        <span>Short introduction</span>
        <textarea rows="3" value={introMessage} onChange={(event) => setIntroMessage(event.target.value)} placeholder="Tell roommates and manager about your group" />
      </label>

      {roommates.map((roommate, index) => (
        <section className="roommate-member-editor" key={`known-roommate-${index}`}>
          <div className="roommate-member-editor-top">
            <h3>Roommate {index + 1}</h3>
            <select value={roommate.mode} onChange={(event) => updateRoommate(index, 'mode', event.target.value)}>
              <option value="manual">Manual roommate</option>
              <option value="registered">Registered tenant</option>
            </select>
          </div>

          {roommate.mode === 'registered' ? (
            <div className="roommate-search-row">
              <input value={roommate.email} onChange={(event) => updateRoommate(index, 'email', event.target.value)} placeholder="Search registered tenant by email or name" />
              <button type="button" className="secondary-btn" onClick={() => searchTenant(index)}>
                {roommate.searchLoading ? 'Searching...' : 'Search'}
              </button>
              {roommate.searchResults?.length ? (
                <div className="roommate-search-results">
                  {roommate.searchResults.map((tenant) => (
                    <button type="button" key={tenant._id} onClick={() => chooseTenant(index, tenant)}>
                      <strong>{tenant.name}</strong>
                      <span>{tenant.email} {tenant.occupation ? `- ${tenant.occupation}` : ''}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="roommate-form-grid">
            <label className="property-field">
              <span>Full name</span>
              <input value={roommate.name} onChange={(event) => updateRoommate(index, 'name', event.target.value)} required />
            </label>
            <label className="property-field">
              <span>Email</span>
              <input type="email" value={roommate.email} onChange={(event) => updateRoommate(index, 'email', event.target.value)} required />
            </label>
            <label className="property-field">
              <span>Phone</span>
              <input value={roommate.phone} onChange={(event) => updateRoommate(index, 'phone', event.target.value)} required={roommate.mode === 'manual'} />
            </label>
            <label className="property-field">
              <span>Occupation</span>
              <input value={roommate.occupation} onChange={(event) => updateRoommate(index, 'occupation', event.target.value)} required />
            </label>
            <label className="property-field">
              <span>Monthly income</span>
              <input type="number" min="0" value={roommate.monthlyIncome} onChange={(event) => updateRoommate(index, 'monthlyIncome', event.target.value)} />
            </label>
            <label className="property-field">
              <span>Relationship with you</span>
              <input value={roommate.relationshipToCreator} onChange={(event) => updateRoommate(index, 'relationshipToCreator', event.target.value)} placeholder="Friend, classmate, colleague" />
            </label>
            <label className="property-field">
              <span>Expected contribution</span>
              <input type="number" min="0" value={roommate.expectedContribution} onChange={(event) => updateRoommate(index, 'expectedContribution', event.target.value)} placeholder={String(rentPerPerson)} />
            </label>
            <label className="property-field">
              <span>Employment / student status</span>
              <input value={roommate.employmentStatus} onChange={(event) => updateRoommate(index, 'employmentStatus', event.target.value)} />
            </label>
          </div>

          <label className="property-field full-width">
            <span>Message / note</span>
            <textarea rows="3" value={roommate.additionalInfo} onChange={(event) => updateRoommate(index, 'additionalInfo', event.target.value)} />
          </label>
        </section>
      ))}

      <label className="property-field full-width">
        <span>Message to Manager (Optional)</span>
        <textarea rows="3" value={messageToManager} onChange={(event) => setMessageToManager(event.target.value)} />
      </label>

      <div className="property-action-buttons">
        <button type="submit" className="primary-btn" disabled={state.submitting}>{state.submitting ? 'Creating...' : 'Create Shared Application'}</button>
      </div>
    </form>
  )
}
