import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <div className="hero">
        <div className="card wide-card">
          <p className="badge">KeyCove Starter</p>
          <h1>Find and manage rental properties easily</h1>
          <p>
            This first version only includes the auth flow: Home, Sign Up, Login,
            Tenant Dashboard, and Manager Dashboard.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="primary-btn">Create Account</Link>
            <Link to="/login" className="secondary-btn">Login</Link>
          </div>
        </div>
      </div>
    </>
  )
}
