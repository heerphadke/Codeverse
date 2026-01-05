/**
 * Card Component
 * Consistent card styling with interactive states
 * 
 * Use for:
 * - Project cards
 * - Stats cards
 * - Info panels
 * - List items
 */

import { HTMLAttributes, forwardRef, ReactNode } from 'react';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'interactive' | 'stat';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  /** Clickable card with hover effects */
  interactive?: boolean;
  /** Selected/active state */
  isActive?: boolean;
  /** Accent color for borders */
  accentColor?: string;
  children: ReactNode;
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

const variantClasses = {
  default: 'bg-[#0a0a0f] border border-[#1a1a2e]',
  elevated: 'bg-[#0a0a0f] border border-[#1a1a2e] shadow-lg',
  outlined: 'bg-transparent border border-[#1a1a2e]',
  interactive: 'bg-[#0a0a0f] border border-[#1a1a2e] cursor-pointer card-interactive hover:border-emerald-500/30 hover:bg-[#0d0d14]',
  stat: 'bg-[#0a0a0f] border border-[#1a1a2e]',
};

const Card = forwardRef<HTMLDivElement, CardProps>(({
  variant = 'default',
  padding = 'md',
  interactive = false,
  isActive = false,
  accentColor,
  className = '',
  style,
  children,
  ...props
}, ref) => {
  const baseClass = 'rounded-xl transition-all duration-200';
  const variantClass = interactive && variant !== 'interactive' 
    ? variantClasses.interactive 
    : variantClasses[variant];
  const paddingClass = paddingClasses[padding];
  const activeClass = isActive ? 'ring-2 ring-emerald-500/50 border-emerald-500/50' : '';

  return (
    <div
      ref={ref}
      className={`${baseClass} ${variantClass} ${paddingClass} ${activeClass} ${className}`}
      style={{
        ...style,
        ...(accentColor ? { borderLeftColor: accentColor, borderLeftWidth: '3px' } : {}),
      }}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;

// Card subcomponents for composition

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function CardHeader({ 
  title, 
  subtitle, 
  icon, 
  action, 
  className = '', 
  children,
  ...props 
}: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between mb-4 ${className}`} {...props}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-[#1a1a2e] flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}
        {(title || subtitle) && (
          <div>
            {title && <h3 className="font-semibold text-white">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {}

export function CardBody({ className = '', children, ...props }: CardBodyProps) {
  return (
    <div className={`${className}`} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** Add top border */
  bordered?: boolean;
}

export function CardFooter({ bordered = true, className = '', children, ...props }: CardFooterProps) {
  return (
    <div 
      className={`mt-4 pt-4 flex items-center justify-between ${bordered ? 'border-t border-[#1a1a2e]/50' : ''} ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
}

// Stat Card preset
interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: { value: number; direction: 'up' | 'down' };
  onClick?: () => void;
  isActive?: boolean;
  color?: 'emerald' | 'blue' | 'purple' | 'amber' | 'gray';
}

const colorClasses = {
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    icon: 'text-emerald-400',
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20 hover:border-blue-500/40',
    icon: 'text-blue-400',
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20 hover:border-purple-500/40',
    icon: 'text-purple-400',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20 hover:border-amber-500/40',
    icon: 'text-amber-400',
  },
  gray: {
    bg: 'bg-gray-500/10',
    border: 'border-[#1a1a2e] hover:border-[#2a2a4a]',
    icon: 'text-gray-400',
  },
};

export function StatCard({ 
  icon, 
  label, 
  value, 
  trend, 
  onClick, 
  isActive,
  color = 'gray',
}: StatCardProps) {
  const colors = colorClasses[color];
  const Element = onClick ? 'button' : 'div';

  return (
    <Element
      onClick={onClick}
      className={`
        w-full p-4 rounded-xl border text-left
        ${isActive ? colors.bg : 'bg-[#0a0a0f]'}
        ${colors.border}
        ${onClick ? 'cursor-pointer interactive' : ''}
        transition-all
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`flex-shrink-0 ${colors.icon}`}>{icon}</span>
        <span className="text-2xl font-bold text-white tabular-nums">{value}</span>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        {trend && (
          <span className={`text-xs font-medium ${trend.direction === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </Element>
  );
}

