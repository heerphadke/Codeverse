/**
 * Register Form Component
 */

import { useState, FormEvent, ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Mail, Lock } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import Button from '../ui/Button';

export default function RegisterForm() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
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

    const { username, email, password, confirmPassword } = formData;

    if (!username || !email || !password || !confirmPassword) {
      setFormError('Please fill in all fields');
      return;
    }

    if (username.length < 3) {
      setFormError('Username must be at least 3 characters');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    try {
      await register(username, email, password);
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
          <UserPlus className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-display-sm text-white mb-2">Create account</h1>
        <p className="text-secondary">Join Codeverse and start collaborating</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {(error || formError) && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{error || formError}</p>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="username" className="block text-sm font-medium text-gray-300">
            Username
          </label>
          <div style={{ position: 'relative' }}>
            <span style={iconWrapperStyle}>
              <User className="w-5 h-5 text-gray-500" />
            </span>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="johndoe"
              value={formData.username}
              onChange={handleChange}
              style={{ paddingLeft: '48px' }}
              className="w-full pr-4 py-3 bg-[#0a0a0a] border border-[#2a2a4a] rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              autoComplete="username"
            />
          </div>
        </div>

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
              placeholder="Min 8 characters"
              value={formData.password}
              onChange={handleChange}
              style={{ paddingLeft: '48px' }}
              className="w-full pr-4 py-3 bg-[#0a0a0a] border border-[#2a2a4a] rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              autoComplete="new-password"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
            Confirm Password
          </label>
          <div style={{ position: 'relative' }}>
            <span style={iconWrapperStyle}>
              <Lock className="w-5 h-5 text-gray-500" />
            </span>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              style={{ paddingLeft: '48px' }}
              className="w-full pr-4 py-3 bg-[#0a0a0a] border border-[#2a2a4a] rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              autoComplete="new-password"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full mt-2"
          size="lg"
          isLoading={isLoading}
        >
          Create account
        </Button>
      </form>

      {/* Footer */}
      <p className="mt-8 text-center text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
