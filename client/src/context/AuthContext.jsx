import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/auth/me').then((r) => setUser(r.data.data)).catch(() => setUser(null)).finally(() => setLoading(false)); }, []);
  const login = async (email, password) => { const { data } = await api.post('/auth/login', { email, password }); setUser(data.data); return data.data; };
  const logout = async () => { await api.post('/auth/logout'); setUser(null); };
  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}
