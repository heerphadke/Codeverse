/**
 * Card Component
 * Container for grouped content with consistent styling
 */

import React, { forwardRef } from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual style variant */
  variant?: 'default' | 'elevated' | 'bordered' | 'ghost';
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Make the card interactive (hoverable) */
  interactive?: boolean;
  /** Full width */
  fullWidth?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      interactive = false,
      fullWidth = false,
      className = '',
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'rounded-xl transition-all';

    const variantStyles = {
      default: 'bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)]',
      elevated: 'bg-[var(--color-surface-elevated)] shadow-lg',
      bordered: 'bg-transparent border border-[var(--color-border-primary)]',
      ghost: 'bg-transparent',
    };

    const paddingStyles = {
      none: '',
      sm: 'p-3',
      md: 'p-5',
      lg: 'p-6',
    };

    const interactiveStyles = interactive
      ? `cursor-pointer hover:border-[var(--color-primary-500)]/30 
         hover:bg-[var(--color-surface-secondary)] hover:-translate-y-0.5
         hover:shadow-lg active:translate-y-0 active:shadow-md`
      : '';

    return (
      <div
        ref={ref}
        role={interactive || onClick ? 'button' : undefined}
        tabIndex={interactive || onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={(e) => {
          if ((interactive || onClick) && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick?.(e as any);
          }
        }}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${paddingStyles[padding]}
          ${interactiveStyles}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;

