/**
 * Auth Page
 * Login and Register pages
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

interface AuthPageProps {
  mode: 'login' | 'register';
}

export default function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuthStore();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        {mode === 'login' ? <LoginForm /> : <RegisterForm />}
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-emerald-600/20 to-cyan-600/20 items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-white"
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
          <h2 className="text-3xl font-bold text-white mb-4">
            Code Together, Create Together
          </h2>
          <p className="text-gray-400 text-lg">
            Real-time collaborative coding with live cursors, instant sync, and seamless code execution.
          </p>
          
          <div className="mt-12 grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">Real-time</div>
              <div className="text-sm text-gray-500">Collaboration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">5+</div>
              <div className="text-sm text-gray-500">Languages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">Instant</div>
              <div className="text-sm text-gray-500">Execution</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

