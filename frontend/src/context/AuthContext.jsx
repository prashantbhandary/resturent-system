import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../services/api';
import { storage } from '../services/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(storage.getUser());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = storage.getToken();
    if (token && !user) {
      authApi.me().then((r) => {
        setUser(r.data.user);
        storage.setUser(r.data.user);
      }).catch(() => {
        storage.setToken(null);
        storage.setUser(null);
      });
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await authApi.login(email, password);
      storage.setToken(data.token);
      storage.setUser(data.user);
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    storage.setToken(null);
    storage.setUser(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
