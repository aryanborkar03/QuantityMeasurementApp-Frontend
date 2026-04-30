import { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import History from './components/History';
import Toast from './components/Toast';

export default function App() {
  // Block rendering until we've checked the URL for OAuth2 callback params.
  // This prevents a single-frame flash of the wrong view on the redirect.
  const [ready, setReady] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState('dashboard');
  const [toast, setToast] = useState({ show: false, msg: '', type: 'info' });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get('token');
    const name   = params.get('name');
    const error  = params.get('error');

    if (token) {
      // ── OAuth2 success callback ────────────────────────────────────────────
      // Backend redirected to http://localhost:5173/?token=xxx&name=John+Doe
      localStorage.setItem('token', token);
      if (name) localStorage.setItem('userName', decodeURIComponent(name));
      setIsAuthenticated(true);
      setView('dashboard');
      // Clean the token out of the URL bar (security + UX)
      window.history.replaceState({}, document.title, '/');
      // Show toast after state is set (microtask delay avoids race)
      setTimeout(() => showToast('Successfully logged in!', 'success'), 100);

    } else if (error) {
      // ── OAuth2 failure callback ────────────────────────────────────────────
      const msg = decodeURIComponent(error) || 'Social login failed.';
      window.history.replaceState({}, document.title, '/');
      setTimeout(() => showToast(msg, 'error'), 100);
      setView('auth');

    } else {
      // ── Normal page load — restore session from localStorage ──────────────
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setIsAuthenticated(true);
      }
    }

    setReady(true);
  }, []);

  const showToast = (msg, type = 'info') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'info' }), 3500);
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    setIsAuthenticated(false);
    setView('dashboard');
    showToast('Logged out successfully', 'info');
  };

  // Block first render until URL params have been checked.
  if (!ready) return null;

  return (
    <div className="min-h-screen text-gray-800 font-sans">
      {toast.show && <Toast msg={toast.msg} type={toast.type} />}

      {view === 'auth' && (
        <Auth
          onLogin={handleLogin}
          onBack={() => setView('dashboard')}
          showToast={showToast}
        />
      )}

      {view === 'history' && isAuthenticated && (
        <History onBack={() => setView('dashboard')} showToast={showToast} />
      )}

      {view === 'dashboard' && (
        <Dashboard
          isAuthenticated={isAuthenticated}
          onAuthClick={() => setView('auth')}
          onHistoryClick={() => setView('history')}
          onLogout={handleLogout}
          showToast={showToast}
        />
      )}
    </div>
  );
}
