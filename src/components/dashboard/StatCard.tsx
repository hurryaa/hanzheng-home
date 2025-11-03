import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: string;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  color,
  trend = 'neutral',
  loading = false,
  onClick
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [animatedValue, setAnimatedValue] = useState<string | number>(0);

  // 数值动画效果
  useEffect(() => {
    if (loading) return;

    const numericValue = typeof value === 'string'
      ? parseFloat(value.replace(/[^\d.-]/g, '')) || 0
      : value;

    if (typeof numericValue === 'number' && !isNaN(numericValue)) {
      let start = 0;
      const duration = 1000;
      const increment = numericValue / (duration / 16);

      const timer = setInterval(() => {
        start += increment;
        if (start >= numericValue) {
          setAnimatedValue(value);
          clearInterval(timer);
        } else {
          if (typeof value === 'string' && value.includes('¥')) {
            setAnimatedValue(`¥${Math.floor(start).toLocaleString()}`);
          } else {
            setAnimatedValue(Math.floor(start));
          }
        }
      }, 16);

      return () => clearInterval(timer);
    } else {
      setAnimatedValue(value);
    }
  }, [value, loading]);

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return 'fa-arrow-up';
      case 'down':
        return 'fa-arrow-down';
      default:
        return 'fa-minus';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'transition-all duration-300 hover:shadow-md transform cursor-pointer',
        isHovered && 'translate-y-[-4px]',
        onClick && 'hover:border-blue-300'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {animatedValue}
          </h3>
          {change && (
            <div className={cn('flex items-center text-sm transition-colors duration-300', getTrendColor())}>
              <i className={cn('fa-solid mr-1 transform transition-transform duration-500', getTrendIcon())}></i>
              {change} 较上月
            </div>
          )}
        </div>
        <div
          className={cn(
            'p-3 rounded-lg text-white shadow-md transform transition-all duration-500',
            color,
            isHovered && 'scale-110 rotate-3'
          )}
        >
          <i className={cn('fa-solid text-xl', icon)}></i>
        </div>
      </div>
    </Card>
  );
};