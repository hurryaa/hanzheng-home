import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface ToastProps {
  id: string;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose: (id: string) => void;
}

export default function Toast({
  id,
  title,
  message,
  type = 'info',
  duration = 5000,
  action,
  onClose
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // 进入动画
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          icon: 'fa-check-circle text-green-600',
          title: 'text-green-800',
          message: 'text-green-700'
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          icon: 'fa-exclamation-circle text-red-600',
          title: 'text-red-800',
          message: 'text-red-700'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          icon: 'fa-exclamation-triangle text-yellow-600',
          title: 'text-yellow-800',
          message: 'text-yellow-700'
        };
      default:
        return {
          bg: 'bg-blue-50 border-blue-200',
          icon: 'fa-info-circle text-blue-600',
          title: 'text-blue-800',
          message: 'text-blue-700'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      className={cn(
        'max-w-sm w-full shadow-lg rounded-lg pointer-events-auto border transition-all duration-300 ease-in-out',
        styles.bg,
        isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <i className={cn('fa-solid text-xl', styles.icon)} />
          </div>
          <div className="ml-3 w-0 flex-1">
            {title && (
              <p className={cn('text-sm font-medium', styles.title)}>
                {title}
              </p>
            )}
            <p className={cn('text-sm', styles.message, title && 'mt-1')}>
              {message}
            </p>
            {action && (
              <div className="mt-3">
                <button
                  onClick={action.onClick}
                  className={cn(
                    'text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded',
                    type === 'success' ? 'text-green-600 focus:ring-green-500' :
                    type === 'error' ? 'text-red-600 focus:ring-red-500' :
                    type === 'warning' ? 'text-yellow-600 focus:ring-yellow-500' :
                    'text-blue-600 focus:ring-blue-500'
                  )}
                >
                  {action.label}
                </button>
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleClose}
              className={cn(
                'rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2',
                type === 'success' ? 'focus:ring-green-500' :
                type === 'error' ? 'focus:ring-red-500' :
                type === 'warning' ? 'focus:ring-yellow-500' :
                'focus:ring-blue-500'
              )}
              aria-label="关闭通知"
            >
              <i className="fa-solid fa-times text-sm" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Toast容器组件
interface ToastContainerProps {
  toasts: ToastProps[];
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export function ToastContainer({
  toasts,
  position = 'top-right'
}: ToastContainerProps) {
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div
      className={cn(
        'fixed z-50 pointer-events-none',
        getPositionClasses()
      )}
      aria-live="polite"
      aria-label="通知区域"
    >
      <div className="flex flex-col space-y-3">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </div>
  );
}

// Toast Hook
export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: removeToast
    };
    setToasts(prev => [...prev, newToast]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const removeAllToasts = () => {
    setToasts([]);
  };

  const success = (message: string, options?: Partial<ToastProps>) => {
    return addToast({ ...options, message, type: 'success' });
  };

  const error = (message: string, options?: Partial<ToastProps>) => {
    return addToast({ ...options, message, type: 'error' });
  };

  const warning = (message: string, options?: Partial<ToastProps>) => {
    return addToast({ ...options, message, type: 'warning' });
  };

  const info = (message: string, options?: Partial<ToastProps>) => {
    return addToast({ ...options, message, type: 'info' });
  };

  return {
    toasts,
    addToast,
    removeToast,
    removeAllToasts,
    success,
    error,
    warning,
    info
  };
}