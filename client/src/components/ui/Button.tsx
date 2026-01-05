/**
 * Button Component
 * Reusable button with variants and proper icon-text spacing
 */

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    // Base styles include gap for consistent icon-text spacing
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0a] disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 focus:ring-emerald-500',
      secondary: 'bg-[#1a1a2e] hover:bg-[#252542] text-gray-200 border border-[#2a2a4a] hover:border-[#3a3a5a] focus:ring-[#3a3a5a]',
      ghost: 'hover:bg-[#1a1a2e] text-gray-300 focus:ring-[#2a2a4a]',
      danger: 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20 focus:ring-red-500',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
