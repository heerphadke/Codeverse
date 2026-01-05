/**
 * Toast Notification Component
 * Displays temporary success/error/info messages
 */

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, X, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = toast.duration || 3000;
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const icons = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
    warning: AlertCircle,
  };

  const colors = {
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    error: 'bg-red-500/10 border-red-500/20 text-red-400',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  };

  const Icon = icons[toast.type];

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm
        ${colors[toast.type]}
        transition-all duration-300
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
        min-w-[300px] max-w-[400px]
      `}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onRemove(toast.id), 300);
        }}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}

// Toast store hook
let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function notify(listeners: typeof toastListeners) {
  listeners.forEach((listener) => listener([...toasts]));
}

export function useToast() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => {
      setCurrentToasts(newToasts);
    };
    toastListeners.push(listener);
    // Initial state
    setCurrentToasts([...toasts]);

    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  const show = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: Toast = { id, message, type, duration };
    toasts = [...toasts, newToast];
    notify(toastListeners);
  }, []);

  const remove = useCallback((id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notify(toastListeners);
  }, []);

  return {
    toasts: currentToasts,
    show,
    remove,
    success: useCallback((message: string, duration?: number) => show(message, 'success', duration), [show]),
    error: useCallback((message: string, duration?: number) => show(message, 'error', duration), [show]),
    info: useCallback((message: string, duration?: number) => show(message, 'info', duration), [show]),
    warning: useCallback((message: string, duration?: number) => show(message, 'warning', duration), [show]),
  };
}

