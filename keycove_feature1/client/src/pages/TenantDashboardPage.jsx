import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'

export default function TenantDashboardPage() {
  const { user } = useAuth()

  return (
    <>
      <Navbar />
      <div className="page-wrap">
        <div className="card dashboard-card">
          <p className="badge">Tenant Dashboard</p>
          <h2>Welcome Tenant</h2>
          <p>You are logged in successfully.</p>
          <div className="info-grid">
            <div><strong>Name:</strong> {user?.name}</div>
            <div><strong>Email:</strong> {user?.email}</div>
            <div><strong>Role:</strong> {user?.role}</div>
          </div>
        </div>
      </div>
    </>
  )
}
