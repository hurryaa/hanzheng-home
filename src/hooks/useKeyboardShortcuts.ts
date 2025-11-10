import { useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  const shortcuts = useMemo<ShortcutConfig[]>(() => ([
    {
      key: 'h',
      altKey: true,
      action: () => navigate('/home'),
      description: '前往工作台'
    },
    {
      key: 'd',
      altKey: true,
      action: () => navigate('/dashboard'),
      description: '前往仪表板'
    },
    {
      key: 'm',
      altKey: true,
      action: () => navigate('/members'),
      description: '前往会员管理'
    },
    {
      key: 'a',
      altKey: true,
      action: () => navigate('/appointments'),
      description: '前往预约管理'
    },
    {
      key: 'c',
      altKey: true,
      action: () => navigate('/consumptions'),
      description: '前往消费管理'
    },
    {
      key: 'r',
      altKey: true,
      action: () => navigate('/recharges'),
      description: '前往会员充值'
    },
    {
      key: 't',
      altKey: true,
      action: () => navigate('/member-cards'),
      description: '前往次卡管理'
    },
    {
      key: 's',
      altKey: true,
      action: () => navigate('/settings'),
      description: '前往系统设置'
    },
    {
      key: 'p',
      altKey: true,
      action: () => navigate('/profile'),
      description: '前往个人资料'
    },
    {
      key: '/',
      ctrlKey: true,
      action: () => {
        const searchInput = document.querySelector('input[placeholder*="搜索"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      },
      description: '聚焦搜索框'
    }
  ]), [navigate]);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // 忽略在输入框中的快捷键
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      // 只允许搜索快捷键在输入框中工作
      if (!(event.ctrlKey && event.key === '/')) {
        return;
      }
    }

    const shortcut = shortcuts.find(s => {
      const keyMatch = s.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = s.ctrlKey === undefined || s.ctrlKey === event.ctrlKey;
      const altMatch = s.altKey === undefined || s.altKey === event.altKey;
      const shiftMatch = s.shiftKey === undefined || s.shiftKey === event.shiftKey;
      
      return keyMatch && ctrlMatch && altMatch && shiftMatch;
    });

    if (shortcut) {
      event.preventDefault();
      shortcut.action();
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  return { shortcuts };
}
