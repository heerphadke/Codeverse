/**
 * IconText Component
 * 
 * A design system component that enforces proper spacing between icons and text.
 * Use this whenever you need to display an icon alongside text to ensure
 * consistent layout across the application.
 * 
 * @example
 * // Basic usage
 * <IconText icon={<Mail className="w-4 h-4" />}>Send Email</IconText>
 * 
 * // With custom gap
 * <IconText icon={<Check />} gap="lg">Completed</IconText>
 * 
 * // Icon on the right
 * <IconText icon={<ChevronRight />} iconPosition="right">Next</IconText>
 */

import { ReactNode, forwardRef, HTMLAttributes } from 'react';

type GapSize = 'xs' | 'sm' | 'md' | 'lg';
type IconPosition = 'left' | 'right';

interface IconTextProps extends HTMLAttributes<HTMLSpanElement> {
  /** The icon element (e.g., Lucide icon) */
  icon: ReactNode;
  /** Text or content to display alongside the icon */
  children: ReactNode;
  /** Spacing between icon and text */
  gap?: GapSize;
  /** Position of the icon relative to text */
  iconPosition?: IconPosition;
  /** Additional CSS classes for the container */
  className?: string;
  /** Make the container a block element instead of inline-flex */
  block?: boolean;
}

// Gap size mapping to Tailwind classes
const gapClasses: Record<GapSize, string> = {
  xs: 'gap-1',    // 4px
  sm: 'gap-1.5',  // 6px
  md: 'gap-2',    // 8px
  lg: 'gap-3',    // 12px
};

const IconText = forwardRef<HTMLSpanElement, IconTextProps>(({
  icon,
  children,
  gap = 'sm',
  iconPosition = 'left',
  className = '',
  block = false,
  ...props
}, ref) => {
  const displayClass = block ? 'flex' : 'inline-flex';
  const gapClass = gapClasses[gap];
  
  return (
    <span
      ref={ref}
      className={`${displayClass} items-center ${gapClass} ${className}`}
      {...props}
    >
      {iconPosition === 'left' && (
        <span className="flex-shrink-0 flex items-center justify-center" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="truncate">{children}</span>
      {iconPosition === 'right' && (
        <span className="flex-shrink-0 flex items-center justify-center" aria-hidden="true">
          {icon}
        </span>
      )}
    </span>
  );
});

IconText.displayName = 'IconText';

export default IconText;

/**
 * InputIcon Component
 * 
 * Specifically designed for form inputs where an icon appears
 * inside or alongside an input field.
 */
interface InputIconProps {
  icon: ReactNode;
  position?: 'left' | 'right';
  className?: string;
}

export function InputIcon({ icon, position = 'left', className = '' }: InputIconProps) {
  return (
    <span 
      className={`flex-shrink-0 flex items-center justify-center text-gray-500 ${className}`}
      aria-hidden="true"
    >
      {icon}
    </span>
  );
}

/**
 * InputWithIcon Component
 * 
 * A complete input field with properly positioned icon.
 * Ensures no overlap between icon and text.
 */
interface InputWithIconProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const InputWithIcon = forwardRef<HTMLInputElement, InputWithIconProps>(({
  icon,
  iconPosition = 'left',
  label,
  error,
  containerClassName = '',
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
  
  return (
    <div className={`space-y-2 ${containerClassName}`}>
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
        {icon && iconPosition === 'left' && (
          <InputIcon icon={icon} position="left" />
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            flex-1 min-w-0 bg-transparent
            text-gray-100 placeholder-gray-500
            focus:outline-none
            ${className}
          `}
          {...props}
        />
        {icon && iconPosition === 'right' && (
          <InputIcon icon={icon} position="right" />
        )}
      </div>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
});

InputWithIcon.displayName = 'InputWithIcon';

