import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader } from './ui'

export function ProtectedRoute() {
  const { bootstrapping, isAuthenticated } = useAuth()
  const location = useLocation()

  if (bootstrapping) {
    return (
      <div className="center-screen">
        <Loader label="Loading your childcare dashboard..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export function PublicRoute() {
  const { bootstrapping, isAuthenticated } = useAuth()

  if (bootstrapping) {
    return (
      <div className="center-screen">
        <Loader label="Preparing the app..." />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
