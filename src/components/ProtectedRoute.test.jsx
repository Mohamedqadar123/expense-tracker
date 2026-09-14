import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AuthContext from '../context/authContext.js';
import ProtectedRoute from './ProtectedRoute.jsx';

function renderProtected(authValue) {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <AuthContext.Provider value={authValue}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<p>Protected content</p>} />
          </Route>
          <Route path="/login" element={<p>Login page</p>} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('redirects to /login when there is no user', () => {
    renderProtected({ user: null, isLoading: false });
    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('shows a loading state instead of redirecting while auth is still loading', () => {
    renderProtected({ user: null, isLoading: true });
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders the protected content when authenticated', () => {
    renderProtected({ user: { id: 1, email: 'a@test.com' }, isLoading: false });
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
});
