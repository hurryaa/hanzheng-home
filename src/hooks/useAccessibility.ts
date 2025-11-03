import { useEffect, useRef, useState } from 'react';
import { generateId, handleKeyboardNavigation, FocusManager, announceToScreenReader } from '@/lib/accessibility';

/**
 * 可访问性增强Hook
 */
export function useAccessibility() {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [fontSize, setFontSize] = useState('normal');

  useEffect(() => {
    // 检测用户偏好
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    setIsHighContrast(highContrastQuery.matches);
    setIsReducedMotion(reducedMotionQuery.matches);

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    highContrastQuery.addEventListener('change', handleHighContrastChange);
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    return () => {
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
    };
  }, []);

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announceToScreenReader(message, priority);
  };

  return {
    isHighContrast,
    isReducedMotion,
    fontSize,
    setFontSize,
    announce
  };
}

/**
 * 焦点管理Hook
 */
export function useFocusManagement(containerRef: React.RefObject<HTMLElement>) {
  const focusManagerRef = useRef<FocusManager | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      focusManagerRef.current = new FocusManager(containerRef.current);
    }
  }, [containerRef]);

  const focusFirst = () => focusManagerRef.current?.focusFirst();
  const focusLast = () => focusManagerRef.current?.focusLast();
  const focusNext = () => focusManagerRef.current?.focusNext();
  const focusPrevious = () => focusManagerRef.current?.focusPrevious();

  return {
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious
  };
}

/**
 * 键盘导航Hook
 */
export function useKeyboardNavigation(options: {
  onEnter?: () => void;
  onSpace?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
}) {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    handleKeyboardNavigation(event.nativeEvent, options);
  };

  return { handleKeyDown };
}

/**
 * 唯一ID生成Hook
 */
export function useId(prefix?: string) {
  const [id] = useState(() => generateId(prefix));
  return id;
}

/**
 * 可访问性表单Hook
 */
export function useAccessibleForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const setFieldError = (field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const clearFieldError = (field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const setFieldTouched = (field: string, isTouched: boolean = true) => {
    setTouched(prev => ({ ...prev, [field]: isTouched }));
  };

  const getFieldProps = (field: string) => ({
    'aria-invalid': !!errors[field],
    'aria-describedby': errors[field] ? `${field}-error` : undefined,
    onBlur: () => setFieldTouched(field, true)
  });

  const getErrorProps = (field: string) => ({
    id: `${field}-error`,
    role: 'alert',
    'aria-live': 'polite' as const
  });

  return {
    errors,
    touched,
    setFieldError,
    clearFieldError,
    setFieldTouched,
    getFieldProps,
    getErrorProps
  };
}

/**
 * 模态框可访问性Hook
 */
export function useModalAccessibility(isOpen: boolean) {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isOpen) {
      // 保存当前焦点
      previousFocusRef.current = document.activeElement as HTMLElement;

      // 阻止背景滚动
      document.body.style.overflow = 'hidden';

      // 聚焦到模态框
      setTimeout(() => {
        if (modalRef.current) {
          const focusManager = new FocusManager(modalRef.current);
          focusManager.focusFirst();
        }
      }, 100);
    } else {
      // 恢复背景滚动
      document.body.style.overflow = 'unset';

      // 恢复之前的焦点
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      // 这里应该调用关闭模态框的函数
    }

    if (event.key === 'Tab' && modalRef.current) {
      const focusManager = new FocusManager(modalRef.current);

      if (event.shiftKey) {
        event.preventDefault();
        focusManager.focusPrevious();
      } else {
        event.preventDefault();
        focusManager.focusNext();
      }
    }
  };

  return {
    modalRef,
    handleKeyDown
  };
}

/**
 * 表格可访问性Hook
 */
export function useTableAccessibility() {
  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    if (tableRef.current) {
      // 为表头添加scope属性
      const headers = tableRef.current.querySelectorAll('th');
      headers.forEach(header => {
        if (!header.getAttribute('scope')) {
          header.setAttribute('scope', 'col');
        }
      });

      // 添加表格描述
      if (!tableRef.current.querySelector('caption')) {
        const caption = document.createElement('caption');
        caption.className = 'sr-only';
        caption.textContent = '数据表格';
        tableRef.current.insertBefore(caption, tableRef.current.firstChild);
      }
    }
  }, []);

  return { tableRef };
}

/**
 * 实时验证Hook
 */
export function useLiveValidation(
  value: string,
  validator: (value: string) => string | null,
  delay: number = 500
) {
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (!value) {
      setError(null);
      return;
    }

    setIsValidating(true);
    const timer = setTimeout(() => {
      const validationError = validator(value);
      setError(validationError);
      setIsValidating(false);

      if (validationError) {
        announceToScreenReader(validationError, 'assertive');
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [value, validator, delay]);

  return { error, isValidating };
}