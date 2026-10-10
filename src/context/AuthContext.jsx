import { useState, useEffect, useCallback } from 'react'
import AuthContext from './authContext.js'
import { getMe, login as apiLogin, signup as apiSignup, logout as apiLogout } from '../api/auth'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const loggedInUser = await apiLogin(email, password);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  // Signing up only sends a confirmation email; there is no user to sign in
  // until the link in it is opened (see the VerifyEmail page).
  const signup = useCallback((email, password, name, plan) => apiSignup(email, password, name, plan), []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  // Re-reads the account after something changes it server-side (a payment
  // extending Pro access, an email being verified).
  const refreshUser = useCallback(async () => {
    const freshUser = await getMe();
    setUser(freshUser);
    return freshUser;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
