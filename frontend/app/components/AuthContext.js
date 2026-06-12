'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getAuthToken, clearAuthToken, fetchJson } from '../../api/api';

const AuthContext = createContext({
  user: null,
  loading: true,
  isLoggedIn: false,
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      fetchJson('/auth/me')
        .then(data => {
          setUser(data);
          setLoading(false);
        })
        .catch(() => {
          clearAuthToken();
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    clearAuthToken();
    setUser(null);
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isLoggedIn: !!user,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
