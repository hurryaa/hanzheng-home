import { cn } from '@/lib/utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export default function Loading({
  size = 'md',
  variant = 'spinner',
  text,
  fullScreen = false,
  className
}: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const SpinnerLoader = () => (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
        sizeClasses[size]
      )}
      role="status"
      aria-label="加载中"
    />
  );

  const DotsLoader = () => (
    <div className="flex space-x-1" role="status" aria-label="加载中">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'bg-blue-600 rounded-full animate-pulse',
            size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1.4s'
          }}
        />
      ))}
    </div>
  );

  const PulseLoader = () => (
    <div
      className={cn(
        'bg-blue-600 rounded-full animate-pulse',
        sizeClasses[size]
      )}
      role="status"
      aria-label="加载中"
    />
  );

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return <DotsLoader />;
      case 'pulse':
        return <PulseLoader />;
      default:
        return <SpinnerLoader />;
    }
  };

  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        className
      )}
    >
      {renderLoader()}
      {text && (
        <p
          className={cn(
            'text-gray-600 font-medium',
            textSizeClasses[size]
          )}
          aria-live="polite"
        >
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50"
        role="dialog"
        aria-modal="true"
        aria-label="页面加载中"
      >
        {content}
      </div>
    );
  }

  return content;
}

// 骨架屏组件
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse'
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200';

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse', // 可以后续添加wave动画
    none: ''
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        variant === 'text' && !height && 'h-4',
        variant === 'text' && !width && 'w-full',
        className
      )}
      style={style}
      role="status"
      aria-label="内容加载中"
    />
  );
}

// 表格骨架屏
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true
}: TableSkeletonProps) {
  return (
    <div className="w-full" role="status" aria-label="表格数据加载中">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {showHeader && (
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, i) => (
                <Skeleton key={i} height={16} className="w-3/4" />
              ))}
            </div>
          </div>
        )}
        <div className="divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="px-6 py-4">
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <Skeleton key={colIndex} height={20} className="w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 卡片骨架屏
interface CardSkeletonProps {
  showAvatar?: boolean;
  showActions?: boolean;
  lines?: number;
}

export function CardSkeleton({
  showAvatar = false,
  showActions = false,
  lines = 3
}: CardSkeletonProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" role="status" aria-label="卡片内容加载中">
      <div className="flex items-start space-x-4">
        {showAvatar && (
          <Skeleton variant="circular" width={48} height={48} />
        )}
        <div className="flex-1 space-y-3">
          <Skeleton height={20} className="w-3/4" />
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton key={i} height={16} className={i === lines - 1 ? 'w-1/2' : 'w-full'} />
          ))}
        </div>
      </div>
      {showActions && (
        <div className="mt-6 flex space-x-3">
          <Skeleton height={36} width={80} />
          <Skeleton height={36} width={80} />
        </div>
      )}
    </div>
  );
}