import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './Auth.css'
import { SavingsIllustration } from '../components/illustrations/Illustrations.jsx'
import { useAuth } from '../context/useAuth.js'
import { verifyEmail } from '../api/auth'

const PAID_PLANS = ['standard', 'pro'];

// Where the link in the sign-up email lands. Opening it signs the person in
// (it creates the account the first time, and signs that account in again
// on later opens until it expires), so this page only ever shows a loading
// line before sending them to the app's Home page, the Dashboard, or on to
// paying for the plan they chose before signing up. It only stays on screen
// when the link can't be used.
function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  // Present when the person chose a paid plan before signing up.
  const plan = PAID_PLANS.includes(searchParams.get('plan')) ? searchParams.get('plan') : null;
  const { refreshUser, signInAs } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [failed, setFailed] = useState(!token);
  // The link must be sent exactly once even though StrictMode runs effects
  // twice in development.
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!token || hasStarted.current) return;
    hasStarted.current = true;
    const destination = plan ? `/billing?plan=${plan}` : '/dashboard';
    verifyEmail(token)
      // The response is the signed-in account, so go now, without asking the
      // server again who is signed in.
      .then((signedInUser) => {
        signInAs(signedInUser);
        navigate(destination, { replace: true });
      })
      // Even when the link itself is no longer accepted, someone who is
      // already signed in in this browser belongs in the app, not on an error.
      .catch(() => refreshUser()
        .then(() => navigate(destination, { replace: true }))
        .catch(() => setFailed(true)));
  }, [token, plan, refreshUser, signInAs, navigate]);

  if (!failed) {
    return <p className="dashboard-status">{t('common.loading')}</p>;
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <SavingsIllustration />
        <h1>Email Verification</h1>
        <p className="auth-error">
          This link has expired. If you already confirmed your email, log in; otherwise sign up again to get a new link.
        </p>
        <p className="auth-switch">
          <Link to="/login">Log in</Link> · <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default VerifyEmail
