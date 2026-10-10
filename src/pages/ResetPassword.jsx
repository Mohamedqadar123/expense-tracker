import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import './Auth.css'
import { SavingsIllustration } from '../components/illustrations/Illustrations.jsx'
import { resetPassword } from '../api/auth'

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await resetPassword(token, password);
      setIsDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  let content;
  if (!token) {
    content = <p className="auth-error">This reset link is invalid. Request a new one.</p>;
  } else if (isDone) {
    content = <p className="subtitle">Your password has been updated. You can now log in with it.</p>;
  } else {
    content = (
      <>
        <p className="subtitle">Choose a new password</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New password (min. 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Set New Password'}
          </button>
        </form>
      </>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <SavingsIllustration />
        <h1>Reset Password</h1>
        {content}
        <p className="auth-switch">
          {token && !isDone
            ? <Link to="/login">Back to log in</Link>
            : <Link to={isDone ? '/login' : '/forgot-password'}>{isDone ? 'Log in' : 'Request a new link'}</Link>}
        </p>
      </div>
    </div>
  );
}

export default ResetPassword
