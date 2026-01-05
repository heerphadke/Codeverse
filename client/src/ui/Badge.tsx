/**
 * Badge Component
 * Status indicator and label tags
 */

import React from 'react';

export interface BadgeProps {
  /** Badge content */
  children: React.ReactNode;
  /** Color variant */
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  /** Size */
  size?: 'sm' | 'md';
  /** Dot indicator (no text) */
  dot?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  className = '',
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full';

  const variantStyles = {
    default: 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border-primary)]',
    primary: 'bg-[var(--color-primary-500)]/10 text-[var(--color-primary-400)] border border-[var(--color-primary-500)]/20',
    secondary: 'bg-[var(--color-secondary-500)]/10 text-[var(--color-secondary-400)] border border-[var(--color-secondary-500)]/20',
    success: 'bg-[var(--color-success)]/10 text-green-400 border border-[var(--color-success)]/20',
    warning: 'bg-[var(--color-warning)]/10 text-amber-400 border border-[var(--color-warning)]/20',
    error: 'bg-[var(--color-error)]/10 text-red-400 border border-[var(--color-error)]/20',
    info: 'bg-[var(--color-info)]/10 text-blue-400 border border-[var(--color-info)]/20',
  };

  const sizeStyles = {
    sm: dot ? 'w-2 h-2' : 'px-2 py-0.5 text-xs',
    md: dot ? 'w-2.5 h-2.5' : 'px-2.5 py-1 text-sm',
  };

  const dotVariantStyles = {
    default: 'bg-[var(--color-text-muted)]',
    primary: 'bg-[var(--color-primary-500)]',
    secondary: 'bg-[var(--color-secondary-500)]',
    success: 'bg-[var(--color-success)]',
    warning: 'bg-[var(--color-warning)]',
    error: 'bg-[var(--color-error)]',
    info: 'bg-[var(--color-info)]',
  };

  if (dot) {
    return (
      <span
        className={`${sizeStyles[size]} ${dotVariantStyles[variant]} rounded-full ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  );
}

