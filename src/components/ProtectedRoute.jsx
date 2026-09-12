import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <p className="dashboard-status">Loading...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute
