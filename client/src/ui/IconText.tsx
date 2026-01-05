/**
 * IconText Component
 * Enforced wrapper for icon + text layouts
 * 
 * REQUIRED: All icon + text combinations MUST use this component
 * to maintain consistent spacing and alignment.
 */

import React from 'react';

export interface IconTextProps {
  /** The icon component or element */
  icon: React.ReactNode;
  /** The text content */
  children: React.ReactNode;
  /** Gap size between icon and text */
  gap?: 'xs' | 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
  /** Icon position */
  iconPosition?: 'left' | 'right';
  /** Make the component clickable */
  onClick?: () => void;
  /** HTML element to render as */
  as?: 'div' | 'span' | 'button' | 'label';
  /** Aria label for accessibility */
  'aria-label'?: string;
}

const gapClasses = {
  xs: 'gap-1',    // 4px
  sm: 'gap-1.5',  // 6px  
  md: 'gap-2',    // 8px
  lg: 'gap-3',    // 12px
};

export default function IconText({
  icon,
  children,
  gap = 'sm',
  className = '',
  iconPosition = 'left',
  onClick,
  as: Component = 'div',
  'aria-label': ariaLabel,
}: IconTextProps) {
  const baseClasses = `inline-flex items-center ${gapClasses[gap]}`;
  
  const content = iconPosition === 'left' ? (
    <>
      <span className="flex-shrink-0 flex items-center">{icon}</span>
      <span className="truncate">{children}</span>
    </>
  ) : (
    <>
      <span className="truncate">{children}</span>
      <span className="flex-shrink-0 flex items-center">{icon}</span>
    </>
  );

  if (Component === 'button' || onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClasses} ${className}`}
        aria-label={ariaLabel}
      >
        {content}
      </button>
    );
  }

  return (
    <Component className={`${baseClasses} ${className}`} aria-label={ariaLabel}>
      {content}
    </Component>
  );
}

