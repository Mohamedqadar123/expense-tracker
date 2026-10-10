import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import './Auth.css'
import { SavingsIllustration } from '../components/illustrations/Illustrations.jsx'
import { useAuth } from '../context/useAuth.js'

const PAID_PLANS = { standard: 'Standard', pro: 'Pro' };

function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  // Set when the visitor picked a paid plan on the Billing page before signing up.
  const [searchParams] = useSearchParams();
  const plan = PAID_PLANS[searchParams.get('plan')] ? searchParams.get('plan') : null;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await signup(email, password, name);
      // Everyone starts on the free trial; someone who chose a paid plan goes
      // straight on to pay for it.
      navigate(plan ? `/billing?plan=${plan}` : '/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <SavingsIllustration />
        <h1>Sign Up</h1>
        <p className="subtitle">Create your Finance Tracker account and try everything free for 7 days</p>
        {plan && (
          <p className="auth-plan">
            Selected plan: <strong>{PAID_PLANS[plan]}</strong>. You can pay right after creating your account.
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
