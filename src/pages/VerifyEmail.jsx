import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import './Auth.css'
import { SavingsIllustration } from '../components/illustrations/Illustrations.jsx'
import { useAuth } from '../context/useAuth.js'
import { verifyEmail } from '../api/auth'

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { user, refreshUser } = useAuth();
  const [state, setState] = useState(token ? 'verifying' : 'error');
  // The token is single-use, so the request must go out exactly once even
  // though StrictMode runs effects twice in development.
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!token || hasStarted.current) return;
    hasStarted.current = true;
    verifyEmail(token)
      .then(() => {
        setState('verified');
        // Only matters if they're logged in on this device; ignore otherwise.
        refreshUser().catch(() => {});
      })
      .catch(() => setState('error'));
  }, [token, refreshUser]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <SavingsIllustration />
        <h1>Email Verification</h1>
        {state === 'verifying' && <p className="subtitle">Verifying your email...</p>}
        {state === 'verified' && <p className="subtitle">Your email is verified. Thank you!</p>}
        {state === 'error' && (
          <p className="auth-error">This verification link is invalid or has expired. Log in to request a new one.</p>
        )}
        <p className="auth-switch">
          <Link to={user ? '/dashboard' : '/login'}>{user ? 'Go to dashboard' : 'Log in'}</Link>
        </p>
      </div>
    </div>
  );
}

export default VerifyEmail
