/**
 * Login Form Component
 */

import { useState, FormEvent, ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import Button from '../ui/Button';

export default function LoginForm() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formError, setFormError] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    clearError();

    const { email, password } = formData;

    if (!email || !password) {
      setFormError('Please fill in all fields');
      return;
    }

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by the store
    }
  };

  // Inline styles for icon positioning (Tailwind v4 compatibility)
  const iconWrapperStyle: React.CSSProperties = {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    zIndex: 10,
  };

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 mb-6 shadow-lg shadow-emerald-500/20">
          <ArrowRight className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-display-sm text-white mb-2">Welcome back</h1>
        <p className="text-secondary">Sign in to continue to Codeverse</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {(error || formError) && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{error || formError}</p>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-300">
            Email
          </label>
          <div style={{ position: 'relative' }}>
            <span style={iconWrapperStyle}>
              <Mail className="w-5 h-5 text-gray-500" />
            </span>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              style={{ paddingLeft: '48px' }}
              className="w-full pr-4 py-3 bg-[#0a0a0a] border border-[#2a2a4a] rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              autoComplete="email"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-300">
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <span style={iconWrapperStyle}>
              <Lock className="w-5 h-5 text-gray-500" />
            </span>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              style={{ paddingLeft: '48px' }}
              className="w-full pr-4 py-3 bg-[#0a0a0a] border border-[#2a2a4a] rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              autoComplete="current-password"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
        >
          Sign in
        </Button>
      </form>

      {/* Footer */}
      <p className="mt-8 text-center text-gray-400">
        Don't have an account?{' '}
        <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
          Sign up
        </Link>
      </p>
    </div>
  );
}
