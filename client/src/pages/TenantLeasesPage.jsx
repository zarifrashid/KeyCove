import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import LeaseCard from '../components/leases/LeaseCard'
import { api } from '../lib/api'

export default function TenantLeasesPage() {
  const [state, setState] = useState({ loading: true, error: '', leases: [] })

  useEffect(() => {
    const fetchMyLeases = async () => {
      try {
        setState((previous) => ({ ...previous, loading: true, error: '' }))
        const { data } = await api.get('/leases/my')
        setState({ loading: false, error: '', leases: data.leases || [] })
      } catch (error) {
        setState({
          loading: false,
          error: error.response?.data?.message || 'Failed to load your leases.',
          leases: []
        })
      }
    }

    fetchMyLeases()
  }, [])

  return (
    <>
      <Navbar />
      <div className="page-wrap dashboard-stack lease-page-wrap">
        <section className="card dashboard-card lease-hero-card">
          <p className="badge">Tenant Lease View</p>
          <h1>My Leases</h1>
          <p>
            View your current and previous residences in one dedicated area. Each card shows lease period,
            rent amount, property details, and manager contact information loaded from the backend.
          </p>
        </section>

        {state.error ? <p className="error-text manager-flash-text">{state.error}</p> : null}

        <section className="card manager-dashboard-list-card">
          <div className="manager-list-header">
            <div>
              <h3>Your Lease Records</h3>
              <p>Only leases connected to your account appear here.</p>
            </div>
          </div>

          {state.loading ? (
            <div className="manager-empty-state">
              <h3>Loading your leases...</h3>
            </div>
          ) : !state.leases.length ? (
            <div className="manager-empty-state">
              <h3>No lease records are linked to your account yet.</h3>
            </div>
          ) : (
            <div className="request-list">
              {state.leases.map((lease) => (
                <LeaseCard key={lease._id} lease={lease} viewerRole="tenant" />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
