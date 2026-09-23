import { useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import {
  clearSession,
  getStoredUser,
  hasSession,
  subscribeToSessionChanges,
  type User,
} from './api';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Simulador from './pages/Simulador';
import Historial from './pages/Historial';

type PrivateRouteProps = {
  children: ReactNode;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Login />} />
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/simulador" element={<Simulador />} />
          <Route
            path="/historial"
            element={(
              <PrivateRoute>
                <Historial />
              </PrivateRoute>
            )}
          />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function AppShell() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSessionSnapshot();
  const displayName = user?.name?.trim() || 'Cuenta activa';

  const handleLogout = () => {
    clearSession();
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <NavLink to="/dashboard" className="brand" aria-label="Ir al dashboard">
          <span className="brand-mark">BE</span>
          <span>
            <strong>Banco Estudiantil</strong>
            <small>Simulador de credito</small>
          </span>
        </NavLink>

        <nav className="nav-links" aria-label="Navegacion principal">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
            Creditos
          </NavLink>
          <NavLink to="/simulador" className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
            Simulador
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/historial" className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
              Historial
            </NavLink>
          )}
        </nav>

        <div className="session-actions">
          {isAuthenticated ? (
            <>
              <span className="session-user">{displayName}</span>
              <button className="btn btn-ghost" type="button" onClick={handleLogout}>
                Salir
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn btn-ghost">
                Ingresar
              </NavLink>
              <NavLink to="/register" className="btn btn-primary">
                Crear cuenta
              </NavLink>
            </>
          )}
        </div>
      </header>
      <Outlet />
    </div>
  );
}

function PrivateRoute({ children }: PrivateRouteProps) {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(hasSession);

  useEffect(() => subscribeToSessionChanges(() => setIsAuthenticated(hasSession())), []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function useSessionSnapshot(): { isAuthenticated: boolean; user: User | null } {
  const [snapshot, setSnapshot] = useState(() => ({
    isAuthenticated: hasSession(),
    user: getStoredUser(),
  }));

  useEffect(() => subscribeToSessionChanges(() => {
    setSnapshot({
      isAuthenticated: hasSession(),
      user: getStoredUser(),
    });
  }), []);

  return snapshot;
}

export default App;
