/**
 * AuthContext – provides authentication state and helpers to the whole app.
 * The JWT token is persisted in localStorage so users stay logged in on refresh.
 */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authApi
        .me()
        .then((res) => setUser(res.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username, password) => {
    const { data } = await authApi.login(username, password);
    localStorage.setItem('token', data.access_token);
    const me = await authApi.me();
    setUser(me.data);
    return me.data;
  }, []);

  const register = useCallback(async (username, email, password) => {
    await authApi.register({ username, email, password });
    return login(username, password);
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
