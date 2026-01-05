/**
 * Skeleton Component
 * Loading placeholder that mimics content structure
 * 
 * Use when:
 * - Data is being fetched
 * - Content shape is known but data isn't ready
 * 
 * @example
 * <Skeleton variant="text" width="200px" />
 * <Skeleton variant="card" />
 * <Skeleton variant="avatar" size="lg" />
 */

import { HTMLAttributes } from 'react';

type SkeletonVariant = 'text' | 'heading' | 'paragraph' | 'avatar' | 'card' | 'button' | 'rect';
type SkeletonSize = 'sm' | 'md' | 'lg';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  size?: SkeletonSize;
  width?: string | number;
  height?: string | number;
  /** Number of lines for paragraph variant */
  lines?: number;
  /** Animate the skeleton */
  animate?: boolean;
}

const sizeMap = {
  sm: { avatar: 'w-8 h-8', text: 'h-3', heading: 'h-5', button: 'h-8 w-20' },
  md: { avatar: 'w-10 h-10', text: 'h-4', heading: 'h-6', button: 'h-10 w-24' },
  lg: { avatar: 'w-12 h-12', text: 'h-5', heading: 'h-8', button: 'h-12 w-32' },
};

export default function Skeleton({
  variant = 'rect',
  size = 'md',
  width,
  height,
  lines = 3,
  animate = true,
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const baseClass = `bg-[#1a1a2e] ${animate ? 'animate-pulse' : ''} rounded`;
  
  const getVariantClass = () => {
    switch (variant) {
      case 'text':
        return `${baseClass} ${sizeMap[size].text} w-full`;
      case 'heading':
        return `${baseClass} ${sizeMap[size].heading} w-3/4`;
      case 'avatar':
        return `${baseClass} ${sizeMap[size].avatar} rounded-full`;
      case 'button':
        return `${baseClass} ${sizeMap[size].button} rounded-xl`;
      case 'card':
        return `${baseClass} rounded-xl p-4`;
      case 'paragraph':
        return ''; // Handled separately
      default:
        return baseClass;
    }
  };

  // Paragraph renders multiple lines
  if (variant === 'paragraph') {
    return (
      <div className={`space-y-2 ${className}`} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClass} ${sizeMap[size].text}`}
            style={{ 
              width: i === lines - 1 ? '60%' : '100%',
              ...style 
            }}
          />
        ))}
      </div>
    );
  }

  // Card renders a complete card skeleton
  if (variant === 'card') {
    return (
      <div className={`${baseClass} ${className}`} style={style} {...props}>
        <div className="flex items-start gap-4 mb-4">
          <Skeleton variant="avatar" size="md" />
          <div className="flex-1">
            <Skeleton variant="text" size="md" className="w-3/4 mb-2" />
            <Skeleton variant="text" size="sm" className="w-1/2" />
          </div>
        </div>
        <Skeleton variant="paragraph" lines={2} size="sm" />
      </div>
    );
  }

  return (
    <div
      className={`${getVariantClass()} ${className}`}
      style={{
        width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
        ...style,
      }}
      {...props}
    />
  );
}

// Preset skeleton groups for common patterns
export function SkeletonList({ count = 3, variant = 'text' }: { count?: number; variant?: SkeletonVariant }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant={variant} />
      ))}
    </div>
  );
}

export function SkeletonProjectCard() {
  return (
    <div className="p-5 rounded-xl bg-[#0a0a0f] border border-[#1a1a2e] animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <Skeleton variant="avatar" size="lg" className="rounded-xl" animate={false} />
        <Skeleton variant="rect" width={32} height={32} className="rounded-lg" animate={false} />
      </div>
      <Skeleton variant="heading" className="mb-2" animate={false} />
      <Skeleton variant="paragraph" lines={2} size="sm" animate={false} />
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-[#1a1a2e]">
        <Skeleton variant="text" size="sm" width={80} animate={false} />
        <Skeleton variant="text" size="sm" width={60} animate={false} />
      </div>
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="p-4 rounded-xl border border-[#1a1a2e] bg-[#0a0a0f] animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <Skeleton variant="rect" width={20} height={20} className="rounded" animate={false} />
        <Skeleton variant="text" size="lg" width={40} animate={false} />
      </div>
      <Skeleton variant="text" size="sm" width={80} animate={false} />
    </div>
  );
}

