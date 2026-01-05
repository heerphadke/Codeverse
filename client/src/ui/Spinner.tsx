/**
 * Spinner Component
 * Loading indicator with accessible label
 */

import React from 'react';

export interface SpinnerProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Color - uses primary by default */
  color?: 'primary' | 'secondary' | 'white' | 'current';
  /** Accessible label */
  label?: string;
  /** Additional CSS classes */
  className?: string;
}

export default function Spinner({
  size = 'md',
  color = 'primary',
  label = 'Loading...',
  className = '',
}: SpinnerProps) {
  const sizeStyles = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
  };

  const colorStyles = {
    primary: 'border-[var(--color-primary-500)] border-t-transparent',
    secondary: 'border-[var(--color-secondary-500)] border-t-transparent',
    white: 'border-white border-t-transparent',
    current: 'border-current border-t-transparent',
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`} role="status">
      <div
        className={`
          ${sizeStyles[size]}
          ${colorStyles[color]}
          rounded-full animate-spin
        `}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

// Full page loading spinner
Spinner.Page = function SpinnerPage({
  label = 'Loading...',
}: {
  label?: string;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
      <div className="text-center">
        <Spinner size="xl" className="mb-4" />
        <p className="text-[var(--color-text-secondary)]">{label}</p>
      </div>
    </div>
  );
};

// Inline loading state
Spinner.Inline = function SpinnerInline({
  label = 'Loading...',
  className = '',
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Spinner size="sm" />
      <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
    </div>
  );
};

