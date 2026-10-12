import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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
  const navigate = useNavigate();
  const [state, setState] = useState(token ? 'verifying' : 'error');
  // The token is single-use, so the request must go out exactly once even
  // though StrictMode runs effects twice in development.
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!token || hasStarted.current) return;
    hasStarted.current = true;
    const destination = plan ? `/billing?plan=${plan}` : '/dashboard';
    // Opening the link signs the person in (it creates the account the first
    // time, and signs that account in again on later opens until it expires),
    // so pick up the session and go straight into the app, or on to paying
    // for the plan chosen beforehand.
    verifyEmail(token)
      .then(() => {
        setState('verified');
        return refreshUser()
          .then(() => navigate(destination, { replace: true }))
          .catch(() => {});
      })
      // Even when the link itself is no longer accepted, someone who is
      // already signed in in this browser belongs in the app, not on an error.
      .catch(() => refreshUser()
        .then(() => navigate(destination, { replace: true }))
        .catch(() => setState('error')));
  }, [token, plan, refreshUser, navigate]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <SavingsIllustration />
        <h1>Email Verification</h1>
        {state === 'verifying' && <p className="subtitle">Signing you in...</p>}
        {state === 'verified' && (
          <p className="subtitle">Your email is confirmed and your account is ready. Welcome!</p>
        )}
        {state === 'error' && (
          <p className="auth-error">
            This link has expired. If you already confirmed your email, log in; otherwise sign up again to get a new link.
          </p>
        )}
        <p className="auth-switch">
          {state === 'error' && <><Link to="/login">Log in</Link> · <Link to="/signup">Sign up</Link></>}
          {state !== 'error' && user && plan && <Link to={`/billing?plan=${plan}`}>Continue to payment</Link>}
          {state !== 'error' && user && !plan && <Link to="/dashboard">Go to dashboard</Link>}
          {state !== 'error' && !user && <Link to="/login">Log in</Link>}
        </p>
      </div>
    </div>
  );
}

export default VerifyEmail
