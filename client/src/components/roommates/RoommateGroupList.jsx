import { useCallback, useEffect, useState } from 'react'
import { api } from '../../lib/api'
import CreateRoommateGroupForm from './CreateRoommateGroupForm'
import JoinRoommateGroupModal from './JoinRoommateGroupModal'
import RoommateGroupCard from './RoommateGroupCard'

export default function RoommateGroupList({ property, actionType, leaseMonths, onBack }) {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [joiningGroup, setJoiningGroup] = useState(null)

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const { data } = await api.get(`/roommate-groups/property/${property._id}?type=${actionType}`)
      setGroups(data.groups || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load roommate groups.')
    } finally {
      setLoading(false)
    }
  }, [actionType, property?._id])

  useEffect(() => {
    if (property?._id) fetchGroups()
  }, [fetchGroups, property?._id])

  if (showCreate) {
    return (
      <CreateRoommateGroupForm
        property={property}
        actionType={actionType}
        leaseMonths={leaseMonths}
        onCreated={fetchGroups}
        onCancel={() => setShowCreate(false)}
      />
    )
  }

  return (
    <section className="roommate-flow-card">
      <div className="roommate-section-header">
        <div>
          <p className="badge">Roommate Groups</p>
          <h2>Roommate groups for this property</h2>
          <p>Other tenants are also looking for roommates for this property. You can view a group, apply to join, or start your own.</p>
        </div>
        <div className="roommate-header-actions">
          <button type="button" className="secondary-btn" onClick={onBack}>Back</button>
          <button type="button" className="primary-btn" onClick={() => setShowCreate(true)}>Start New Group</button>
        </div>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {loading ? <p>Loading roommate groups...</p> : null}

      {!loading && !groups.length ? (
        <div className="manager-empty-state">
          <h3>No roommate groups yet.</h3>
          <p>Start the first group for this property and approve join requests before the application goes to the manager.</p>
        </div>
      ) : null}

      <div className="roommate-group-list">
        {groups.map((group) => (
          <RoommateGroupCard key={group._id} group={group} onApply={setJoiningGroup} />
        ))}
      </div>

      {joiningGroup ? (
        <JoinRoommateGroupModal
          group={joiningGroup}
          onClose={() => setJoiningGroup(null)}
          onSubmitted={fetchGroups}
        />
      ) : null}
    </section>
  )
}
