import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import './App.css';
import Dashboard from './pages/Dashboard';
import Trips from './pages/Trips';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import { AuthProvider, useAuth } from './context/AuthContext';

/**
 * AppShell renders the navigation and main content area.
 */
function AppShell() {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState('light');
  const apiBase = useMemo(() => process.env.REACT_APP_API_BASE_URL || '', []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="app-shell" aria-live="polite">
      <aside className="sidebar" aria-label="Main">
        <div className="brand">
          <div className="brand-badge" aria-hidden />
          <div>
            <div className="brand-title">Travel Budget</div>
            <div className="subtitle">Plan • Track • Optimize</div>
          </div>
        </div>
        <nav className="nav">
          <NavLink to="/" end className={({isActive}) => isActive ? 'active' : undefined}>🏠 Dashboard</NavLink>
          <NavLink to="/trips" className={({isActive}) => isActive ? 'active' : undefined}>🧭 Trips</NavLink>
          <NavLink to="/expenses" className={({isActive}) => isActive ? 'active' : undefined}>💳 Expenses</NavLink>
          <NavLink to="/reports" className={({isActive}) => isActive ? 'active' : undefined}>📊 Reports</NavLink>
          <NavLink to="/settings" className={({isActive}) => isActive ? 'active' : undefined}>⚙️ Settings</NavLink>
        </nav>
        <div style={{marginTop: 16}} className="stack">
          <button className="btn" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>
          {apiBase ? <div className="badge"><span>API</span> {apiBase}</div> : <div className="badge warning">API not set</div>}
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div className="spread">
            <strong>Welcome{user ? `, ${user.name || user.email}` : ''}</strong>
          </div>
          <div className="actions">
            {!user && <NavLink to="/login" className="btn">Sign in</NavLink>}
            {!user && <NavLink to="/register" className="btn primary">Create account</NavLink>}
            {user && <button className="btn" onClick={logout}>Sign out</button>}
          </div>
        </header>

        <div className="container">
          <Routes>
            <Route path="/" element={<RequireAuth><Dashboard/></RequireAuth>} />
            <Route path="/trips" element={<RequireAuth><Trips/></RequireAuth>} />
            <Route path="/expenses" element={<RequireAuth><Expenses/></RequireAuth>} />
            <Route path="/reports" element={<RequireAuth><Reports/></RequireAuth>} />
            <Route path="/settings" element={<RequireAuth><Settings/></RequireAuth>} />
            <Route path="/login" element={<Login/>} />
            <Route path="/register" element={<Register/>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

/**
// PUBLIC_INTERFACE
 * RequireAuth protects routes and redirects to /login.
 */
function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// PUBLIC_INTERFACE
export default function App() {
  /** Root app with AuthProvider and Router */
  return (
    <AuthProvider>
      <Router>
        <AppShell />
      </Router>
    </AuthProvider>
  );
}
