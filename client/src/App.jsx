import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SignupPage from './pages/SignupPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PropertyDetailsPage from './pages/PropertyDetailsPage'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import AddPropertyPage from './pages/AddPropertyPage'
import { useAuth } from './context/AuthContext'

function AuthOnlyRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="center-box">Checking login...</div>
  if (user) return <Navigate to="/" replace />

  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/explore"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-property"
        element={
          <ProtectedRoute>
            <AddPropertyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/properties/:id"
        element={
          <ProtectedRoute>
            <PropertyDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <AuthOnlyRoute>
            <SignupPage />
          </AuthOnlyRoute>
        }
      />
      <Route
        path="/login"
        element={
          <AuthOnlyRoute>
            <LoginPage />
          </AuthOnlyRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tenant-dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager-dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
