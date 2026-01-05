/**
 * Header Component
 * Main navigation header
 */

import { Link, useNavigate } from 'react-router-dom';
import { Code2, LogOut, User, Settings, Home, Share2, Users } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import Button from '../ui/Button';

interface HeaderProps {
  showNav?: boolean;
  roomName?: string;
  roomSlug?: string;
  onShareClick?: () => void;
  onMembersClick?: () => void;
  userRole?: 'owner' | 'editor' | 'viewer';
}

export default function Header({ 
  showNav = true, 
  roomName, 
  roomSlug,
  onShareClick,
  onMembersClick,
  userRole,
}: HeaderProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const canShare = userRole === 'owner' || userRole === 'editor';

  return (
    <header className="h-14 bg-[#0a0a0a] border-b border-[#1a1a2e] flex items-center justify-between px-4">
      {/* Logo */}
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-white">Codeverse</span>
        </Link>
        
        {roomName && (
          <>
            <span className="text-gray-600">/</span>
            <span className="text-gray-300 font-medium">{roomName}</span>
          </>
        )}
      </div>

      {/* Navigation */}
      {showNav && isAuthenticated && (
        <nav className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Button>

          {/* Room actions */}
          {roomSlug && (
            <>
              {canShare && onShareClick && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onShareClick}
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              )}
              {onMembersClick && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMembersClick}
                >
                  <Users className="w-4 h-4" />
                  Members
                </Button>
              )}
            </>
          )}
          
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#1a1a2e] transition-colors">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium text-white"
                style={{ backgroundColor: user?.color || '#4ECDC4' }}
              >
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm text-gray-300">{user?.username}</span>
            </button>
            
            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-1 w-48 py-1 bg-[#1a1a2e] border border-[#2a2a4a] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <button
                className="nav-item w-full px-4 py-2 text-sm text-gray-300 hover:bg-[#2a2a4a]"
                onClick={() => navigate('/settings')}
              >
                <Settings className="w-4 h-4 flex-shrink-0" />
                <span>Settings</span>
              </button>
              <hr className="my-1 border-[#2a2a4a]" />
              <button
                className="nav-item w-full px-4 py-2 text-sm text-red-400 hover:bg-[#2a2a4a]"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Auth buttons for non-authenticated users */}
      {!isAuthenticated && (
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate('/login')}>
            Sign in
          </Button>
          <Button onClick={() => navigate('/register')}>
            Get Started
          </Button>
        </div>
      )}
    </header>
  );
}

