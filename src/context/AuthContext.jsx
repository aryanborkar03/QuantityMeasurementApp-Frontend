import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);   // { email, name, role }
  const [loading, setLoading] = useState(true);

  // ── On mount: restore session from stored JWT ──────────────────────────────
  useEffect(() => {
    restoreSession();
  }, []);

  // Also handle OAuth redirect — Spring sends ?token=<jwt> back to the frontend
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthToken = params.get('token');
    if (oauthToken) {
      localStorage.setItem('token', oauthToken);
      window.history.replaceState({}, document.title, window.location.pathname);
      restoreSession();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function restoreSession() {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }

    try {
      const res = await authAPI.getMe();
      setSession({
        email: res.data.email,
        name:  res.data.name,
        role:  res.data.role,
      });
    } catch {
      // Token expired / invalid — clear it
      localStorage.removeItem('token');
      setSession(null);
    } finally {
      setLoading(false);
    }
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  async function login(email, password) {
    try {
      const res = await authAPI.login({ email, password });
      const { accessToken, name, role } = res.data;

      localStorage.setItem('token', accessToken);
      setSession({ email, name, role });
      toast.success(`Welcome back, ${name}!`);
      return true;
    } catch (err) {
      const msg = err.response?.status === 401
        ? 'Invalid email or password'
        : 'Login failed. Please try again.';
      toast.error(msg);
      return false;
    }
  }

  // ── Register ───────────────────────────────────────────────────────────────
  async function signup(name, email, password) {
    try {
      const res = await authAPI.register({ name, email, password });
      const { accessToken, role } = res.data;

      localStorage.setItem('token', accessToken);
      setSession({ email, name, role });
      toast.success(`Account created! Welcome, ${name}!`);
      return true;
    } catch (err) {
      const msg = err.response?.status === 409
        ? 'An account with this email already exists.'
        : 'Signup failed. Please try again.';
      toast.error(msg);
      return false;
    }
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  function logout() {
    localStorage.removeItem('token');
    setSession(null);
    toast.info('Logged out');
  }

  // ── OAuth redirects ────────────────────────────────────────────────────────
  function loginWithGoogle() {
    window.location.href = authAPI.googleOAuthUrl;
  }

  function loginWithGithub() {
    window.location.href = authAPI.githubOAuthUrl;
  }

  return (
    <AuthContext.Provider value={{ session, loading, login, signup, logout, loginWithGoogle, loginWithGithub }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
