/**
 * Input Component
 * Form input with label and icon support
 */

import React, { forwardRef } from 'react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input label */
  label?: string;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Left icon */
  leftIcon?: React.ReactNode;
  /** Right icon */
  rightIcon?: React.ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Full width */
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      size = 'md',
      fullWidth = true,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const sizeStyles = {
      sm: 'h-8 text-sm',
      md: 'h-10 text-sm',
      lg: 'h-12 text-base',
    };

    const paddingStyles = {
      sm: leftIcon ? 'pl-8 pr-3' : rightIcon ? 'pl-3 pr-8' : 'px-3',
      md: leftIcon ? 'pl-10 pr-4' : rightIcon ? 'pl-4 pr-10' : 'px-4',
      lg: leftIcon ? 'pl-12 pr-4' : rightIcon ? 'pl-4 pr-12' : 'px-4',
    };

    const iconSizeStyles = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-5 h-5',
    };

    const iconPositionStyles = {
      sm: leftIcon ? 'left-2.5' : 'right-2.5',
      md: leftIcon ? 'left-3' : 'right-3',
      lg: leftIcon ? 'left-4' : 'right-4',
    };

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <span
              className={`absolute ${iconPositionStyles[size]} top-1/2 -translate-y-1/2 
                         text-[var(--color-text-muted)] pointer-events-none`}
              aria-hidden="true"
            >
              <span className={iconSizeStyles[size]}>{leftIcon}</span>
            </span>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full ${sizeStyles[size]} ${paddingStyles[size]}
              bg-[var(--color-surface-primary)] 
              border rounded-xl
              text-[var(--color-text-primary)] 
              placeholder-[var(--color-text-muted)]
              transition-all
              focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]/30 
              ${error 
                ? 'border-[var(--color-error)] focus:border-[var(--color-error)]' 
                : 'border-[var(--color-border-primary)] focus:border-[var(--color-primary-500)]'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
              ${className}
            `.trim().replace(/\s+/g, ' ')}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
          
          {rightIcon && (
            <span
              className={`absolute ${iconPositionStyles[size]} top-1/2 -translate-y-1/2 
                         text-[var(--color-text-muted)] pointer-events-none`}
              aria-hidden="true"
            >
              <span className={iconSizeStyles[size]}>{rightIcon}</span>
            </span>
          )}
        </div>
        
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-sm text-[var(--color-error)]"
            role="alert"
          >
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="mt-1.5 text-sm text-[var(--color-text-tertiary)]"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

