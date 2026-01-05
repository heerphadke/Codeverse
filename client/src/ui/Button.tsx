/**
 * Button Component
 * Primary UI action element with variants and states
 */

import React, { forwardRef } from 'react';
import Spinner from './Spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2 font-semibold
      rounded-xl transition-all
      focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
      focus-visible:ring-offset-[var(--color-bg-primary)]
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    `;

    const variantStyles = {
      primary: `
        bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-primary-600)]
        text-white shadow-lg shadow-[var(--color-primary-500)]/20
        hover:shadow-xl hover:shadow-[var(--color-primary-500)]/30
        hover:from-[var(--color-primary-400)] hover:to-[var(--color-primary-500)]
        active:scale-[0.98]
        focus-visible:ring-[var(--color-primary-500)]
      `,
      secondary: `
        bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)]
        border border-[var(--color-border-primary)]
        hover:bg-[var(--color-bg-active)] hover:border-[var(--color-border-secondary)]
        active:scale-[0.98]
        focus-visible:ring-[var(--color-border-secondary)]
      `,
      ghost: `
        bg-transparent text-[var(--color-text-secondary)]
        hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]
        active:scale-[0.98]
        focus-visible:ring-[var(--color-border-secondary)]
      `,
      danger: `
        bg-[var(--color-error)] text-white
        hover:bg-red-600
        active:scale-[0.98]
        focus-visible:ring-[var(--color-error)]
      `,
    };

    const sizeStyles = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        {...props}
      >
        {isLoading ? (
          <>
            <Spinner size={size === 'lg' ? 'md' : 'sm'} />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

