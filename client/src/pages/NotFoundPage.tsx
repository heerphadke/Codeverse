/**
 * 404 Not Found Page
 * Displayed when route doesn't match
 */

import { Link, useLocation } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuthStore } from '../stores/authStore';

export default function NotFoundPage() {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        {/* Visual */}
        <div className="relative mb-8">
          <div className="text-[150px] font-bold text-[#1a1a2e] leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center border border-emerald-500/20">
              <Search className="w-12 h-12 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Content */}
        <h1 className="text-3xl font-bold text-white mb-3">Page Not Found</h1>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or may have been moved.
          {location.pathname && (
            <span className="block mt-2 text-sm text-gray-500 font-mono">
              {location.pathname}
            </span>
          )}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to={isAuthenticated ? '/dashboard' : '/'}>
            <Button size="lg">
              <Home className="w-4 h-4 mr-2" />
              {isAuthenticated ? 'Go to Dashboard' : 'Go Home'}
            </Button>
          </Link>
          <Button
            variant="secondary"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Help text */}
        <p className="mt-8 text-sm text-gray-500">
          Need help?{' '}
          <a href="mailto:support@codeverse.dev" className="text-emerald-400 hover:text-emerald-300">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}

