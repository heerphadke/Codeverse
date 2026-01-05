/**
 * Join Page
 * Handles invite link joins
 */

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Users, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { roomsApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import Button from '../components/ui/Button';

export default function JoinPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'needs-auth'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setStatus('needs-auth');
      return;
    }

    joinRoom();
  }, [authLoading, isAuthenticated, slug, token]);

  const joinRoom = async () => {
    if (!slug) {
      setStatus('error');
      setError('Invalid invite link');
      return;
    }

    try {
      setStatus('loading');
      const result = await roomsApi.join(slug, token || undefined);
      setRoomName(result.name);
      setStatus('success');
      
      // Auto-redirect after short delay
      setTimeout(() => {
        navigate(`/room/${slug}`);
      }, 1500);
    } catch (err: any) {
      setStatus('error');
      setError(err.response?.data?.error || 'Failed to join room');
    }
  };

  // Loading auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Needs authentication
  if (status === 'needs-auth') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
            <Users className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Join Project</h1>
          <p className="text-gray-400 mb-8">
            Sign in to join this collaborative project
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/login', { state: { from: { pathname: `/join/${slug}${token ? `?token=${token}` : ''}` } } })}
              className="w-full"
              size="lg"
            >
              Sign in to continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link 
                to={`/register`}
                state={{ from: { pathname: `/join/${slug}${token ? `?token=${token}` : ''}` } }}
                className="text-emerald-400 hover:text-emerald-300"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading join
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Joining project...</h2>
          <p className="text-gray-400">Please wait</p>
        </div>
      </div>
    );
  }

  // Success
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Successfully Joined!</h1>
          <p className="text-gray-400 mb-6">
            You've joined <span className="text-white font-medium">{roomName}</span>
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to project...
          </p>
        </div>
      </div>
    );
  }

  // Error
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <XCircle className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Unable to Join</h1>
        <p className="text-gray-400 mb-6">{error}</p>
        <div className="space-y-3">
          <Button onClick={joinRoom} variant="secondary">
            Try Again
          </Button>
          <Button onClick={() => navigate('/dashboard')} variant="ghost">
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

