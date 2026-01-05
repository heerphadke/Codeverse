/**
 * EmptyState Component
 * Placeholder for empty lists/states with optional CTA
 */

import React from 'react';
import Button from './Button';
import { FolderOpen } from 'lucide-react';

export interface EmptyStateProps {
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Custom icon component */
  icon?: React.ReactNode;
  /** Primary action button text */
  actionLabel?: string;
  /** Primary action click handler */
  onAction?: () => void;
  /** Secondary action button text */
  secondaryActionLabel?: string;
  /** Secondary action click handler */
  onSecondaryAction?: () => void;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

export default function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  size = 'md',
  className = '',
}: EmptyStateProps) {
  const sizeStyles = {
    sm: {
      container: 'py-8',
      icon: 'w-12 h-12 mb-3',
      iconInner: 'w-6 h-6',
      title: 'text-base',
      description: 'text-sm',
    },
    md: {
      container: 'py-12',
      icon: 'w-16 h-16 mb-4',
      iconInner: 'w-8 h-8',
      title: 'text-lg',
      description: 'text-sm',
    },
    lg: {
      container: 'py-16',
      icon: 'w-24 h-24 mb-6',
      iconInner: 'w-12 h-12',
      title: 'text-xl',
      description: 'text-base',
    },
  };

  const styles = sizeStyles[size];

  return (
    <div className={`text-center ${styles.container} ${className}`}>
      <div
        className={`${styles.icon} rounded-2xl bg-gradient-to-br 
                   from-[var(--color-primary-500)]/10 to-[var(--color-secondary-500)]/10 
                   flex items-center justify-center mx-auto
                   border border-[var(--color-primary-500)]/20`}
      >
        {icon || (
          <FolderOpen className={`${styles.iconInner} text-[var(--color-primary-400)]`} />
        )}
      </div>
      
      <h3 className={`${styles.title} font-semibold text-[var(--color-text-primary)] mb-2`}>
        {title}
      </h3>
      
      {description && (
        <p className={`${styles.description} text-[var(--color-text-tertiary)] max-w-md mx-auto mb-6`}>
          {description}
        </p>
      )}
      
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center justify-center gap-3">
          {actionLabel && onAction && (
            <Button onClick={onAction} size={size === 'lg' ? 'lg' : 'md'}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button onClick={onSecondaryAction} variant="secondary" size={size === 'lg' ? 'lg' : 'md'}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

