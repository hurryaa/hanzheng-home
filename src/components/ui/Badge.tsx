import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  icon?: string;
  pulse?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({
    className,
    variant = 'default',
    size = 'md',
    dot = false,
    icon,
    pulse = false,
    children,
    ...props
  }, ref) => {
    const baseStyles = 'inline-flex items-center font-medium rounded-full transition-all duration-200';

    const variants = {
      default: 'bg-gray-100 text-gray-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      danger: 'bg-red-100 text-red-800',
      info: 'bg-blue-100 text-blue-800',
      secondary: 'bg-purple-100 text-purple-800'
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-0.5 text-xs',
      lg: 'px-3 py-1 text-sm'
    };

    const dotSizes = {
      sm: 'w-1.5 h-1.5',
      md: 'w-2 h-2',
      lg: 'w-2.5 h-2.5'
    };

    const iconSizes = {
      sm: 'text-xs',
      md: 'text-xs',
      lg: 'text-sm'
    };

    const dotColors = {
      default: 'bg-gray-500',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      danger: 'bg-red-500',
      info: 'bg-blue-500',
      secondary: 'bg-purple-500'
    };

    return (
      <span
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          pulse && 'animate-pulse',
          className
        )}
        ref={ref}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'rounded-full mr-1.5',
              dotSizes[size],
              dotColors[variant],
              pulse && 'animate-ping'
            )}
          />
        )}

        {icon && (
          <i className={cn(
            `fa-solid ${icon}`,
            iconSizes[size],
            children && 'mr-1'
          )}></i>
        )}

        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// 状态徽章组件
export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled' | 'expired';
}

export const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, ...props }, ref) => {
    const statusConfig = {
      active: { variant: 'success' as const, text: '活跃', icon: 'fa-check-circle' },
      inactive: { variant: 'secondary' as const, text: '非活跃', icon: 'fa-pause-circle' },
      pending: { variant: 'warning' as const, text: '待处理', icon: 'fa-clock' },
      completed: { variant: 'success' as const, text: '已完成', icon: 'fa-check' },
      cancelled: { variant: 'danger' as const, text: '已取消', icon: 'fa-times' },
      expired: { variant: 'danger' as const, text: '已过期', icon: 'fa-exclamation-triangle' }
    };

    const config = statusConfig[status];

    return (
      <Badge
        ref={ref}
        variant={config.variant}
        icon={config.icon}
        {...props}
      >
        {config.text}
      </Badge>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

// 数量徽章组件
export interface CountBadgeProps extends Omit<BadgeProps, 'children'> {
  count: number;
  max?: number;
  showZero?: boolean;
}

export const CountBadge = React.forwardRef<HTMLSpanElement, CountBadgeProps>(
  ({ count, max = 99, showZero = false, ...props }, ref) => {
    if (count === 0 && !showZero) {
      return null;
    }

    const displayCount = count > max ? `${max}+` : count.toString();

    return (
      <Badge
        ref={ref}
        variant="danger"
        size="sm"
        {...props}
      >
        {displayCount}
      </Badge>
    );
  }
);

CountBadge.displayName = 'CountBadge';

export { Badge };