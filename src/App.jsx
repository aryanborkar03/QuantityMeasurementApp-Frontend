import { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import History from './components/History';
import Toast from './components/Toast';

export default function App() {
  const hasToken = !!localStorage.getItem('token');
  const [view, setView] = useState('dashboard'); 
  const [isAuthenticated, setIsAuthenticated] = useState(hasToken);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'info' });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const name = params.get('name'); // Grab the real name from the URL
    const error = params.get('error');

    if (token) {
      localStorage.setItem('token', token);
      
      // Use the real name from Google/GitHub, decode the spaces
      if (name) {
        localStorage.setItem('userName', decodeURIComponent(name));
      }
      
      setIsAuthenticated(true);
      setView('dashboard');
      showToast('Successfully logged in!', 'success');
      window.history.replaceState({}, document.title, "/");
    } else if (error) {
      showToast('Social login failed.', 'error');
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  const showToast = (msg, type = 'info') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'info' }), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    setIsAuthenticated(false);
    setView('dashboard');
    showToast('Logged out successfully', 'info');
  };

  return (
    <div className="min-h-screen text-gray-800 font-sans">
      {toast.show && <Toast msg={toast.msg} type={toast.type} />}
      
      {view === 'auth' && (
        <Auth 
          onLogin={() => { setIsAuthenticated(true); setView('dashboard'); }} 
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