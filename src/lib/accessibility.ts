// 可访问性工具函数

/**
 * 生成唯一的ID，用于aria-labelledby等属性
 */
export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 键盘导航处理器
 */
export const handleKeyboardNavigation = (
  event: KeyboardEvent,
  options: {
    onEnter?: () => void;
    onSpace?: () => void;
    onEscape?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
  }
) => {
  const { key } = event;

  switch (key) {
    case 'Enter':
      if (options.onEnter) {
        event.preventDefault();
        options.onEnter();
      }
      break;
    case ' ':
    case 'Space':
      if (options.onSpace) {
        event.preventDefault();
        options.onSpace();
      }
      break;
    case 'Escape':
      if (options.onEscape) {
        event.preventDefault();
        options.onEscape();
      }
      break;
    case 'ArrowUp':
      if (options.onArrowUp) {
        event.preventDefault();
        options.onArrowUp();
      }
      break;
    case 'ArrowDown':
      if (options.onArrowDown) {
        event.preventDefault();
        options.onArrowDown();
      }
      break;
    case 'ArrowLeft':
      if (options.onArrowLeft) {
        event.preventDefault();
        options.onArrowLeft();
      }
      break;
    case 'ArrowRight':
      if (options.onArrowRight) {
        event.preventDefault();
        options.onArrowRight();
      }
      break;
  }
};

/**
 * 焦点管理工具
 */
export class FocusManager {
  private focusableElements: HTMLElement[] = [];
  private currentIndex = -1;

  constructor(container: HTMLElement) {
    this.updateFocusableElements(container);
  }

  updateFocusableElements(container: HTMLElement) {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    this.focusableElements = Array.from(
      container.querySelectorAll(focusableSelectors)
    ) as HTMLElement[];
  }

  focusFirst() {
    if (this.focusableElements.length > 0) {
      this.currentIndex = 0;
      this.focusableElements[0].focus();
    }
  }

  focusLast() {
    if (this.focusableElements.length > 0) {
      this.currentIndex = this.focusableElements.length - 1;
      this.focusableElements[this.currentIndex].focus();
    }
  }

  focusNext() {
    if (this.focusableElements.length > 0) {
      this.currentIndex = (this.currentIndex + 1) % this.focusableElements.length;
      this.focusableElements[this.currentIndex].focus();
    }
  }

  focusPrevious() {
    if (this.focusableElements.length > 0) {
      this.currentIndex = this.currentIndex <= 0
        ? this.focusableElements.length - 1
        : this.currentIndex - 1;
      this.focusableElements[this.currentIndex].focus();
    }
  }
}

/**
 * 屏幕阅读器公告
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // 清理
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * 检查元素是否在视口中
 */
export const isElementInViewport = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

/**
 * 滚动到元素并聚焦
 */
export const scrollToAndFocus = (element: HTMLElement, options?: ScrollIntoViewOptions) => {
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    ...options
  });

  // 等待滚动完成后聚焦
  setTimeout(() => {
    element.focus();
  }, 300);
};

/**
 * 颜色对比度检查（简化版）
 */
export const checkColorContrast = (foreground: string, background: string): boolean => {
  // 这里是简化的实现，实际项目中建议使用专业的颜色对比度库
  // 如 'color-contrast' 或 'wcag-contrast'
  return true; // 占位符实现
};

/**
 * 为表格添加可访问性属性
 */
export const enhanceTableAccessibility = (table: HTMLTableElement) => {
  // 为表头添加scope属性
  const headers = table.querySelectorAll('th');
  headers.forEach(header => {
    if (!header.getAttribute('scope')) {
      header.setAttribute('scope', 'col');
    }
  });

  // 为表格添加caption（如果没有的话）
  if (!table.querySelector('caption')) {
    const caption = document.createElement('caption');
    caption.className = 'sr-only';
    caption.textContent = '数据表格';
    table.insertBefore(caption, table.firstChild);
  }
};

/**
 * 为表单添加可访问性增强
 */
export const enhanceFormAccessibility = (form: HTMLFormElement) => {
  const inputs = form.querySelectorAll('input, select, textarea');

  inputs.forEach(input => {
    const label = form.querySelector(`label[for="${input.id}"]`);
    if (!label && !input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
      console.warn('Input element missing accessible label:', input);
    }

    // 为必填字段添加aria-required
    if (input.hasAttribute('required') && !input.getAttribute('aria-required')) {
      input.setAttribute('aria-required', 'true');
    }
  });
};