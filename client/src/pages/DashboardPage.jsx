import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <>
      <Navbar />
      <div className="page-wrap">
        <div className="card dashboard-card">
          <p className="badge">Simple Dashboard</p>
          <h2>Welcome, {user?.name || 'User'}</h2>
          <p>You are logged in successfully.</p>
          <div className="info-grid">
            <div><strong>Name:</strong> {user?.name}</div>
            <div><strong>Email:</strong> {user?.email}</div>
            <div><strong>Role:</strong> {user?.role}</div>
            <div><strong>User ID:</strong> {user?.id}</div>
          </div>
          <p style={{ marginTop: '16px' }}>
            This is your starter dashboard. Later, you can show tenant tools for tenants and manager tools for managers here.
          </p>
        </div>
      </div>
    </>
  )
}
