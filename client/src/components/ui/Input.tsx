/**
 * Input Component
 * Styled form input with optional icon support
 */

import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, id, icon, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
    
    return (
      <div className="space-y-2">
        {label && (
          <label 
            htmlFor={inputId} 
            className="block text-sm font-medium text-gray-300"
          >
            {label}
          </label>
        )}
        <div className={`
          flex items-center gap-3 px-4 py-3
          bg-[#0a0a0a] border rounded-xl
          focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500
          transition-all duration-200
          ${error ? 'border-red-500 focus-within:ring-red-500/50 focus-within:border-red-500' : 'border-[#2a2a4a]'}
        `}>
          {icon && (
            <span className="text-gray-500 flex-shrink-0">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              flex-1 bg-transparent
              text-gray-100 placeholder-gray-500
              focus:outline-none
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
