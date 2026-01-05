/**
 * StateIndicator Component
 * Visual indicators for various states (online, active, stale, etc.)
 * 
 * Use for:
 * - User online status
 * - Project activity status
 * - Connection status
 * - Real-time presence
 */

import { ReactNode } from 'react';

type StatusType = 'online' | 'offline' | 'busy' | 'away' | 'active' | 'stale' | 'error';

interface StatusIndicatorProps {
  status: StatusType;
  /** Show pulse animation for active states */
  pulse?: boolean;
  /** Size of the indicator */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Additional classes */
  className?: string;
}

const statusColors: Record<StatusType, string> = {
  online: 'bg-emerald-500',
  offline: 'bg-gray-500',
  busy: 'bg-red-500',
  away: 'bg-yellow-500',
  active: 'bg-emerald-500',
  stale: 'bg-gray-500',
  error: 'bg-red-500',
};

const sizeClasses = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
};

export function StatusDot({ 
  status, 
  pulse = false, 
  size = 'sm',
  className = '' 
}: StatusIndicatorProps) {
  const shouldPulse = pulse && (status === 'online' || status === 'active');
  
  return (
    <span className={`relative flex ${className}`}>
      {shouldPulse && (
        <span 
          className={`
            absolute inline-flex h-full w-full rounded-full 
            ${statusColors[status]} opacity-75 animate-ping
          `}
        />
      )}
      <span 
        className={`
          relative inline-flex rounded-full 
          ${sizeClasses[size]} ${statusColors[status]}
        `}
      />
    </span>
  );
}

/**
 * Activity Badge - Shows time-based activity state
 */
interface ActivityBadgeProps {
  lastActiveAt: string | Date;
  className?: string;
}

export function ActivityBadge({ lastActiveAt, className = '' }: ActivityBadgeProps) {
  const getActivityState = (date: Date): { status: StatusType; label: string } => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 5) return { status: 'online', label: 'Active now' };
    if (minutes < 60) return { status: 'active', label: `Active ${minutes}m ago` };
    if (hours < 24) return { status: 'away', label: `Active ${hours}h ago` };
    if (days < 7) return { status: 'stale', label: `Active ${days}d ago` };
    return { status: 'offline', label: 'Inactive' };
  };

  const date = new Date(lastActiveAt);
  const { status, label } = getActivityState(date);

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${className}`}>
      <StatusDot status={status} pulse={status === 'online'} size="xs" />
      <span className="text-gray-500">{label}</span>
    </span>
  );
}

/**
 * Presence Indicator - Shows real-time user presence
 */
interface PresenceIndicatorProps {
  users: Array<{ id: string; color: string; name: string }>;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

const presenceSizes = {
  sm: { avatar: 'w-6 h-6 text-xs', overlap: '-ml-1.5' },
  md: { avatar: 'w-7 h-7 text-xs', overlap: '-ml-2' },
  lg: { avatar: 'w-8 h-8 text-sm', overlap: '-ml-2.5' },
};

export function PresenceIndicator({ users, max = 3, size = 'md' }: PresenceIndicatorProps) {
  const config = presenceSizes[size];
  const visible = users.slice(0, max);
  const overflow = users.length - max;

  if (users.length === 0) return null;

  return (
    <div className="flex items-center">
      <div className="flex">
        {visible.map((user, i) => (
          <div
            key={user.id}
            className={`
              ${config.avatar} ${i > 0 ? config.overlap : ''} 
              rounded-full flex items-center justify-center
              font-medium text-white border-2 border-[#0a0a0a]
              transition-transform hover:scale-110 hover:z-10
            `}
            style={{ backgroundColor: user.color }}
            title={user.name}
          >
            {user.name[0].toUpperCase()}
          </div>
        ))}
        {overflow > 0 && (
          <div
            className={`
              ${config.avatar} ${config.overlap}
              rounded-full flex items-center justify-center
              font-medium text-gray-400 bg-[#1a1a2e] border-2 border-[#0a0a0a]
            `}
          >
            +{overflow}
          </div>
        )}
      </div>
      {users.length === 1 && (
        <span className="ml-2 text-sm text-gray-400">{users[0].name}</span>
      )}
    </div>
  );
}

/**
 * Connection Status - Shows WebSocket/network connection state
 */
interface ConnectionStatusProps {
  isConnected: boolean;
  isConnecting?: boolean;
}

export function ConnectionStatus({ isConnected, isConnecting = false }: ConnectionStatusProps) {
  if (isConnecting) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-yellow-400">
        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        Connecting...
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
      <StatusDot status={isConnected ? 'online' : 'offline'} pulse={isConnected} size="xs" />
      {isConnected ? 'Connected' : 'Disconnected'}
    </span>
  );
}

/**
 * Live Counter - Animated count that responds to changes
 */
interface LiveCounterProps {
  count: number;
  label?: string;
  icon?: ReactNode;
}

export function LiveCounter({ count, label, icon }: LiveCounterProps) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
      {icon}
      <span className="font-medium text-white tabular-nums transition-all">
        {count}
      </span>
      {label && <span>{label}</span>}
    </span>
  );
}

