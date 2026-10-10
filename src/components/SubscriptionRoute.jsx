import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

// Once the free trial is over and no plan is paid for, the only page left in
// the app is Billing. The API enforces the same rule (402).
function SubscriptionRoute() {
  const { user } = useAuth();

  if (!user?.access?.hasAccess) {
    return <Navigate to="/billing" replace />;
  }

  return <Outlet />;
}

export default SubscriptionRoute
