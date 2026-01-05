/**
 * Skeleton Component
 * Loading placeholder with shimmer animation
 */

import React from 'react';

export interface SkeletonProps {
  /** Width - can be number (pixels) or string (CSS value) */
  width?: number | string;
  /** Height - can be number (pixels) or string (CSS value) */
  height?: number | string;
  /** Shape variant */
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  /** Additional CSS classes */
  className?: string;
  /** Animation enabled */
  animate?: boolean;
}

export default function Skeleton({
  width,
  height,
  variant = 'text',
  className = '',
  animate = true,
}: SkeletonProps) {
  const baseStyles = 'bg-[var(--color-surface-elevated)]';
  
  const variantStyles = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-xl',
  };

  const animationStyles = animate
    ? 'animate-shimmer bg-gradient-to-r from-[var(--color-surface-elevated)] via-[var(--color-border-primary)] to-[var(--color-surface-elevated)] bg-[length:200%_100%]'
    : '';

  const style: React.CSSProperties = {};
  if (width !== undefined) {
    style.width = typeof width === 'number' ? `${width}px` : width;
  }
  if (height !== undefined) {
    style.height = typeof height === 'number' ? `${height}px` : height;
  }

  // For circular, ensure equal width/height
  if (variant === 'circular') {
    const size = width || height || 40;
    style.width = typeof size === 'number' ? `${size}px` : size;
    style.height = typeof size === 'number' ? `${size}px` : size;
  }

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${animationStyles} ${className}`}
      style={style}
      aria-hidden="true"
      role="presentation"
    />
  );
}

// Compound components for common use cases
Skeleton.Text = function SkeletonText({ 
  lines = 1, 
  className = '' 
}: { 
  lines?: number; 
  className?: string; 
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          variant="text" 
          width={i === lines - 1 && lines > 1 ? '80%' : '100%'} 
        />
      ))}
    </div>
  );
};

Skeleton.Avatar = function SkeletonAvatar({ 
  size = 40, 
  className = '' 
}: { 
  size?: number; 
  className?: string; 
}) {
  return <Skeleton variant="circular" width={size} height={size} className={className} />;
};

Skeleton.Card = function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`p-5 rounded-xl border border-[var(--color-border-primary)] ${className}`}>
      <div className="flex items-start gap-4">
        <Skeleton variant="rounded" width={48} height={48} />
        <div className="flex-1 space-y-3">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
    </div>
  );
};

