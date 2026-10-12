import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Auth.css'
import { SavingsIllustration } from '../components/illustrations/Illustrations.jsx'
import { forgotPassword } from '../api/auth'
import Field from '../components/Field.jsx'

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await forgotPassword(email);
      setIsSent(true);
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
        <h1>Reset Password</h1>
        {isSent ? (
          <p className="subtitle">
            If an account exists for {email}, we've sent a link to reset your password. It expires in 1 hour.
          </p>
        ) : (
          <>
            <p className="subtitle">Enter your email and we'll send you a reset link</p>
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
              {error && <p className="auth-error" role="alert">{error}</p>}
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
        <p className="auth-switch">
          <Link to="/login">Back to log in</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword
