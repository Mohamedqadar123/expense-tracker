import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import './Auth.css'
import { SavingsIllustration } from '../components/illustrations/Illustrations.jsx'
import { useAuth } from '../context/useAuth.js'

const PAID_PLANS = { standard: 'Standard', pro: 'Pro' };

function Signup() {
  const { signup } = useAuth();
  // Set when the visitor picked a paid plan on the Billing page before signing up.
  const [searchParams] = useSearchParams();
  const plan = PAID_PLANS[searchParams.get('plan')] ? searchParams.get('plan') : null;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // The address the confirmation link was sent to, once the form is accepted.
  const [sentTo, setSentTo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      // The account isn't created yet: the server emails a link, and opening
      // it is what registers the account (and carries the chosen plan along).
      await signup(email, password, name, plan || undefined);
      setSentTo(email);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sentTo) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <SavingsIllustration />
          <h1>Check Your Email</h1>
          <p className="subtitle">
            We sent a confirmation link to <strong>{sentTo}</strong>. Open it to create your account.
          </p>
          <p className="auth-plan">
            Your account is only created after you open the link, so we know the email address is really yours.
            The link works for 24 hours.
          </p>
          <p className="auth-switch">
            Nothing arrived? Check your spam folder, or{' '}
            <button type="button" className="auth-link-button" onClick={() => setSentTo(null)}>try again</button>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <SavingsIllustration />
        <h1>Sign Up</h1>
        <p className="subtitle">Create your Finance Tracker account and try everything free for 7 days</p>
        {plan && (
          <p className="auth-plan">
            Selected plan: <strong>{PAID_PLANS[plan]}</strong>. You can pay right after confirming your email.
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password (min. 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
        <p className="auth-switch">
          <Link to="/billing">Compare plans</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup
