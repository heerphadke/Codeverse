/**
 * Presence Panel Component
 * Shows users currently in the room with live status
 */

import { useEffect, useState } from 'react';
import { Users, Circle, Wifi, WifiOff } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useAuthStore } from '../../stores/authStore';

interface AwarenessUser {
  clientId: number;
  name: string;
  color: string;
  cursor?: { lineNumber: number; column: number };
  isCurrentUser: boolean;
}

export default function PresencePanel() {
  const { provider, isConnected } = useEditorStore();
  const { user: currentUser } = useAuthStore();
  const [awarenessUsers, setAwarenessUsers] = useState<AwarenessUser[]>([]);

  // Track users from Yjs Awareness
  useEffect(() => {
    if (!provider?.awareness) return;

    const awareness = provider.awareness;

    const updateUsers = () => {
      const states = awareness.getStates();
      const users: AwarenessUser[] = [];

      states.forEach((state: any, clientId: number) => {
        if (state.user) {
          users.push({
            clientId,
            name: state.user.name || 'Anonymous',
            color: state.user.color || '#888888',
            cursor: state.cursor,
            isCurrentUser: clientId === awareness.clientID,
          });
        }
      });

      // Sort: current user first, then alphabetically
      users.sort((a, b) => {
        if (a.isCurrentUser) return -1;
        if (b.isCurrentUser) return 1;
        return a.name.localeCompare(b.name);
      });

      setAwarenessUsers(users);
    };

    awareness.on('change', updateUsers);
    updateUsers();

    return () => {
      awareness.off('change', updateUsers);
    };
  }, [provider]);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border-l border-[#1a1a2e] w-56">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a2e]">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">
            Live
          </span>
        </div>
        <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
          {awarenessUsers.length}
        </span>
      </div>

      {/* Connection status */}
      <div className="px-4 py-2.5 border-b border-[#1a1a2e]">
        <div className="flex items-center gap-2 text-xs">
          {isConnected ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-yellow-400 font-medium">Connecting...</span>
            </>
          )}
        </div>
      </div>

      {/* Users list */}
      <div className="flex-1 overflow-y-auto py-2">
        {awarenessUsers.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">
            {isConnected ? 'No other users' : 'Connecting...'}
          </div>
        ) : (
          <div className="space-y-0.5">
            {awarenessUsers.map((user) => (
              <UserItem key={user.clientId} user={user} />
            ))}
          </div>
        )}
      </div>

      {/* Collaboration info */}
      <div className="p-3 border-t border-[#1a1a2e]">
        <p className="text-xs text-gray-500 text-center">
          {awarenessUsers.length > 1 
            ? `${awarenessUsers.length} collaborators editing`
            : 'Share this room to collaborate'
          }
        </p>
      </div>
    </div>
  );
}

function UserItem({ user }: { user: AwarenessUser }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 hover:bg-[#1a1a2e]/50 transition-colors">
      {/* Avatar */}
      <div className="relative">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white shadow-lg"
          style={{ 
            backgroundColor: user.color,
            boxShadow: `0 0 0 2px ${user.color}30`,
          }}
        >
          {user.name[0].toUpperCase()}
        </div>
        {/* Online indicator */}
        <div 
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0a0a0a]"
          style={{ backgroundColor: '#10b981' }}
        />
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-200 truncate">
          {user.name}
          {user.isCurrentUser && (
            <span className="text-gray-500 font-normal ml-1">(you)</span>
          )}
        </p>
        {user.cursor && (
          <p className="text-xs text-gray-500">
            Line {user.cursor.lineNumber}
          </p>
        )}
      </div>

      {/* Typing indicator */}
      {user.cursor && !user.isCurrentUser && (
        <div className="flex gap-0.5">
          <div 
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: user.color }}
          />
        </div>
      )}
    </div>
  );
}
