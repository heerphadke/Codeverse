/**
 * EmptyState Component
 * Displayed when there's no data or content to show
 * 
 * REQUIRED for every list/collection view:
 * - Projects list
 * - Members list
 * - Files list
 * - Search results
 * 
 * @example
 * <EmptyState
 *   icon={FolderOpen}
 *   title="No projects yet"
 *   description="Create your first project to get started"
 *   action={{ label: "Create Project", onClick: () => {} }}
 * />
 */

import { ReactNode, ElementType } from 'react';
import Button from './Button';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

interface EmptyStateProps {
  /** Lucide icon component */
  icon?: ElementType;
  /** Custom icon element (for more complex icons) */
  iconElement?: ReactNode;
  /** Main message */
  title: string;
  /** Supporting description */
  description?: string;
  /** Primary action button */
  action?: EmptyStateAction;
  /** Secondary action */
  secondaryAction?: EmptyStateAction;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
}

const sizeConfig = {
  sm: {
    container: 'py-8',
    iconBox: 'w-12 h-12 mb-3',
    iconSize: 'w-6 h-6',
    title: 'text-base',
    description: 'text-sm',
  },
  md: {
    container: 'py-12',
    iconBox: 'w-16 h-16 mb-4',
    iconSize: 'w-8 h-8',
    title: 'text-lg',
    description: 'text-sm',
  },
  lg: {
    container: 'py-16',
    iconBox: 'w-20 h-20 mb-5',
    iconSize: 'w-10 h-10',
    title: 'text-xl',
    description: 'text-base',
  },
};

export default function EmptyState({
  icon: Icon,
  iconElement,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  className = '',
}: EmptyStateProps) {
  const config = sizeConfig[size];

  return (
    <div className={`text-center ${config.container} ${className}`}>
      {/* Icon */}
      {(Icon || iconElement) && (
        <div
          className={`
            ${config.iconBox} mx-auto rounded-2xl
            bg-gradient-to-br from-emerald-500/10 to-cyan-500/10
            border border-emerald-500/20
            flex items-center justify-center
          `}
        >
          {iconElement || (Icon && <Icon className={`${config.iconSize} text-emerald-400`} />)}
        </div>
      )}

      {/* Text */}
      <h3 className={`${config.title} font-semibold text-white mb-2`}>
        {title}
      </h3>
      {description && (
        <p className={`${config.description} text-gray-500 max-w-md mx-auto mb-6`}>
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center justify-center gap-3">
          {secondaryAction && (
            <Button
              variant={secondaryAction.variant || 'secondary'}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
          {action && (
            <Button
              variant={action.variant || 'primary'}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Preset empty states for common scenarios
 */

export function NoProjectsEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      title="Welcome to Codeverse"
      description="Create your first collaborative coding room to start building with your team in real-time"
      action={{ label: "Create Your First Project", onClick: onCreate }}
      size="lg"
    />
  );
}

export function NoSearchResultsEmptyState({ onClear }: { onClear: () => void }) {
  return (
    <EmptyState
      title="No results found"
      description="Try adjusting your search or filters to find what you're looking for"
      action={{ label: "Clear filters", onClick: onClear, variant: 'secondary' }}
      size="md"
    />
  );
}

export function NoFilesEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      title="No files yet"
      description="Create your first file to start coding"
      action={{ label: "New File", onClick: onCreate }}
      size="sm"
    />
  );
}

export function NoMembersEmptyState({ onInvite }: { onInvite: () => void }) {
  return (
    <EmptyState
      title="Just you here"
      description="Invite collaborators to work together in real-time"
      action={{ label: "Invite Members", onClick: onInvite }}
      size="sm"
    />
  );
}

export function ErrorEmptyState({ 
  message, 
  onRetry 
}: { 
  message?: string; 
  onRetry?: () => void 
}) {
  return (
    <EmptyState
      title="Something went wrong"
      description={message || "An unexpected error occurred. Please try again."}
      action={onRetry ? { label: "Try Again", onClick: onRetry } : undefined}
      size="md"
    />
  );
}

