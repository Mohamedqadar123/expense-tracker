import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AuthContext from '../context/authContext.js';

export function renderWithProviders(ui, {
  route = '/',
  authValue = { user: null, isLoading: false, login: vi.fn(), signup: vi.fn(), logout: vi.fn() },
  ...renderOptions
} = {}) {
  function Wrapper({ children }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <AuthContext.Provider value={authValue}>
          {children}
        </AuthContext.Provider>
      </MemoryRouter>
    );
  }
  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
