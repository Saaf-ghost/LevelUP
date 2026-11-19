import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SprintProvider } from './context/SprintContext';
import { ThemeProvider } from './context/ThemeContext';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AdministratorRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isAdministrator } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdministrator) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const RouteFallback = () => (
  <div className="flex h-screen w-full items-center justify-center bg-paper text-sm text-ink-faint">
    Loading BoostUP…
  </div>
);

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SprintProvider>
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route index element={<Dashboard />} />
                  <Route path="admin" element={<AdministratorRoute><AdminDashboard /></AdministratorRoute>} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </SprintProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
