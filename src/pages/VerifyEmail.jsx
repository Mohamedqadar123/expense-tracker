import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import './Auth.css'
import { SavingsIllustration } from '../components/illustrations/Illustrations.jsx'
import { useAuth } from '../context/useAuth.js'
import { verifyEmail } from '../api/auth'

const PAID_PLANS = ['standard', 'pro'];

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  // Present when the person chose a paid plan before signing up.
  const plan = PAID_PLANS.includes(searchParams.get('plan')) ? searchParams.get('plan') : null;
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
        // Confirming a new sign-up creates the account and signs it in, so
        // pick up the session.
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
        {state === 'verified' && (
          <p className="subtitle">Your email is confirmed and your account is ready. Welcome!</p>
        )}
        {state === 'error' && (
          <p className="auth-error">This link is invalid or has expired. Sign up again to get a new one.</p>
        )}
        <p className="auth-switch">
          {state === 'error' && <Link to="/billing">Sign up</Link>}
          {state !== 'error' && user && plan && <Link to={`/billing?plan=${plan}`}>Continue to payment</Link>}
          {state !== 'error' && user && !plan && <Link to="/dashboard">Go to dashboard</Link>}
          {state !== 'error' && !user && <Link to="/login">Log in</Link>}
        </p>
      </div>
    </div>
  );
}

export default VerifyEmail
