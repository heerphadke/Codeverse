/**
 * Main App Component
 * Routes and authentication provider
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { ToastContainer, useToast } from './components/ui/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';

// Pages
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import EditorPage from './pages/EditorPage';
import JoinPage from './pages/JoinPage';
import NotFoundPage from './pages/NotFoundPage';
import LandingPage from './pages/LandingPage';

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve the intended destination for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

// Public route - redirect if already authenticated
function PublicRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    // Redirect to intended destination or dashboard
    const from = (location.state as any)?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}

// Landing page - show landing for unauthenticated, dashboard for authenticated
function LandingRoute() {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <LandingPage />;
}

// App Content with auth initialization
function AppContent() {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
          </div>
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Landing - show landing page for unauthenticated users */}
      <Route path="/" element={<LandingRoute />} />
      
      {/* Auth routes - redirect if already logged in */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AuthPage mode="login" />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <AuthPage mode="register" />
          </PublicRoute>
        }
      />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Editor routes - support multiple URL patterns */}
      <Route
        path="/room/:slug"
        element={
          <ProtectedRoute>
            <EditorPage />
          </ProtectedRoute>
        }
      />
      
      {/* Canonical project URLs */}
      <Route
        path="/projects/:slug"
        element={
          <ProtectedRoute>
            <EditorPage />
          </ProtectedRoute>
        }
      />
      
      {/* Deep link to specific file */}
      <Route
        path="/projects/:slug/files/:fileId"
        element={
          <ProtectedRoute>
            <EditorPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/room/:slug/files/:fileId"
        element={
          <ProtectedRoute>
            <EditorPage />
          </ProtectedRoute>
        }
      />

      {/* Join via invite link */}
      <Route path="/join/:slug" element={<JoinPage />} />

      {/* 404 - Show proper error page instead of silent redirect */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppContent />
        <ToastWrapper />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

// Toast wrapper component
function ToastWrapper() {
  const { toasts, remove } = useToast();
  return <ToastContainer toasts={toasts} onRemove={remove} />;
}
