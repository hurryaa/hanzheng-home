import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  type = 'info',
  isLoading = false
}: ConfirmDialogProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // 防止背景滚动
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // ESC键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, isLoading, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: 'fa-exclamation-triangle',
          iconColor: 'text-red-600',
          iconBg: 'bg-red-100',
          confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        };
      case 'warning':
        return {
          icon: 'fa-exclamation-circle',
          iconColor: 'text-yellow-600',
          iconBg: 'bg-yellow-100',
          confirmButton: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
        };
      default:
        return {
          icon: 'fa-info-circle',
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-100',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
        };
    }
  };

  const typeStyles = getTypeStyles();

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* 对话框容器 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={cn(
            "relative transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all",
            "w-full max-w-md p-6",
            isOpen ? "animate-in fade-in-0 zoom-in-95" : "animate-out fade-out-0 zoom-out-95"
          )}
        >
          {/* 图标和标题 */}
          <div className="flex items-start">
            <div className={cn(
              "mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full",
              typeStyles.iconBg
            )}>
              <i className={cn("fa-solid", typeStyles.icon, typeStyles.iconColor, "text-xl")} />
            </div>
          </div>

          <div className="mt-4 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {message}
            </p>
          </div>

          {/* 按钮组 */}
          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className={cn(
                "inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors",
                "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={cn(
                "inline-flex justify-center rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                typeStyles.confirmButton,
                isLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  处理中...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for using confirm dialog
export function useConfirmDialog() {
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'info';
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    isLoading: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
    isLoading: false
  });

  const showConfirm = (options: {
    title: string;
    message: string;
    type?: 'danger' | 'warning' | 'info';
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void | Promise<void>;
  }) => {
    setDialog({
      isOpen: true,
      title: options.title,
      message: options.message,
      type: options.type || 'info',
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      onConfirm: async () => {
        setDialog(prev => ({ ...prev, isLoading: true }));
        try {
          await options.onConfirm();
          setDialog(prev => ({ ...prev, isOpen: false, isLoading: false }));
        } catch (error) {
          setDialog(prev => ({ ...prev, isLoading: false }));
        }
      },
      isLoading: false
    });
  };

  const closeDialog = () => {
    if (!dialog.isLoading) {
      setDialog(prev => ({ ...prev, isOpen: false }));
    }
  };

  const ConfirmDialogComponent = () => (
    <ConfirmDialog
      isOpen={dialog.isOpen}
      onClose={closeDialog}
      onConfirm={dialog.onConfirm}
      title={dialog.title}
      message={dialog.message}
      type={dialog.type}
      confirmText={dialog.confirmText}
      cancelText={dialog.cancelText}
      isLoading={dialog.isLoading}
    />
  );

  return {
    showConfirm,
    ConfirmDialog: ConfirmDialogComponent
  };
}