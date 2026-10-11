import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Auth.css'
import { SavingsIllustration } from '../components/illustrations/Illustrations.jsx'
import { useAuth } from '../context/useAuth.js'
import Field from '../components/Field.jsx'

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
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
        <h1>Log In</h1>
        <p className="subtitle">Welcome back to Finance Tracker</p>
        <form onSubmit={handleSubmit}>
          <Field label="Email">
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        <p className="auth-switch">
          <Link to="/forgot-password">Forgot your password?</Link>
        </p>
        <p className="auth-switch">
          Don't have an account? <Link to="/billing">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login
