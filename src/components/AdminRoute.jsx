import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

// The admin API rejects non-admins on its own; this just keeps the page out
// of reach in the UI.
function AdminRoute() {
  const { user } = useAuth();

  if (!user?.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default AdminRoute
