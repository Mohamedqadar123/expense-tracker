import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import SubscriptionRoute from './components/SubscriptionRoute.jsx'
import ProRoute from './components/ProRoute.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import { useAuth } from './context/useAuth.js'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import VerifyEmail from './pages/VerifyEmail.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Transactions from './pages/Transactions.jsx'
import Budgets from './pages/Budgets.jsx'
import Accounts from './pages/Accounts.jsx'
import Goals from './pages/Goals.jsx'
import Reports from './pages/Reports.jsx'
import Recurring from './pages/Recurring.jsx'
import FinanceAI from './pages/FinanceAI.jsx'
import Calculator from './pages/Calculator.jsx'
import Billing from './pages/Billing.jsx'
import Admin from './pages/Admin.jsx'

// Visitors see the marketing page at "/"; signed-in users go straight to the app.
function Home() {
  const { user, isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return <p className="dashboard-status">{t('common.loading')}</p>;
  }
  return user ? <Navigate to="/dashboard" replace /> : <Landing />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/billing" element={<Billing />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
          <Route element={<SubscriptionRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/recurring" element={<Recurring />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route element={<ProRoute />}>
              <Route path="/finance-ai" element={<FinanceAI />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default App
