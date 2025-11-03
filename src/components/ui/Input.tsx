import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconClick?: () => void;
  variant?: 'default' | 'filled' | 'outlined';
  inputSize?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type = 'text',
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    onRightIconClick,
    variant = 'default',
    inputSize = 'md',
    fullWidth = false,
    disabled,
    ...props
  }, ref) => {
    const baseStyles = 'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0';

    const variants = {
      default: 'border border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500',
      filled: 'border-0 bg-gray-100 focus:ring-blue-500 focus:bg-white',
      outlined: 'border-2 border-gray-300 bg-white focus:ring-blue-500 focus:border-blue-500'
    };

    const sizes = {
      sm: 'px-3 py-2 text-sm rounded-md',
      md: 'px-4 py-2.5 text-sm rounded-lg',
      lg: 'px-4 py-3 text-base rounded-lg'
    };

    const iconSizes = {
      sm: 'text-sm',
      md: 'text-sm',
      lg: 'text-base'
    };

    const hasError = !!error;
    const errorStyles = hasError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : '';
    const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : '';

    return (
      <div className={cn('flex flex-col', fullWidth && 'w-full')}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className={cn(`fa-solid ${leftIcon} text-gray-400`, iconSizes[inputSize])}></i>
            </div>
          )}

          <input
            type={type}
            className={cn(
              baseStyles,
              variants[variant],
              sizes[inputSize],
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              errorStyles,
              disabledStyles,
              fullWidth && 'w-full',
              className
            )}
            ref={ref}
            disabled={disabled}
            {...props}
          />

          {rightIcon && (
            <div
              className={cn(
                'absolute inset-y-0 right-0 pr-3 flex items-center',
                onRightIconClick ? 'cursor-pointer' : 'pointer-events-none'
              )}
              onClick={onRightIconClick}
            >
              <i className={cn(
                `fa-solid ${rightIcon}`,
                hasError ? 'text-red-400' : 'text-gray-400',
                onRightIconClick && 'hover:text-gray-600',
                iconSizes[inputSize]
              )}></i>
            </div>
          )}
        </div>

        {(error || helperText) && (
          <div className="mt-2">
            {error && (
              <p className="text-sm text-red-600 flex items-center">
                <i className="fa-solid fa-exclamation-circle mr-1"></i>
                {error}
              </p>
            )}
            {!error && helperText && (
              <p className="text-sm text-gray-500">{helperText}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// 搜索输入框组件
export interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'rightIcon'> {
  onSearch?: (value: string) => void;
  onClear?: () => void;
  showClearButton?: boolean;
  debounceMs?: number;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({
    onSearch,
    onClear,
    showClearButton = true,
    debounceMs = 300,
    value,
    onChange,
    ...props
  }, ref) => {
    const [searchValue, setSearchValue] = React.useState(value || '');
    const debounceTimer = React.useRef<NodeJS.Timeout>();

    React.useEffect(() => {
      if (value !== undefined) {
        setSearchValue(value as string);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setSearchValue(newValue);

      if (onChange) {
        onChange(e);
      }

      if (onSearch) {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
          onSearch(newValue);
        }, debounceMs);
      }
    };

    const handleClear = () => {
      setSearchValue('');
      if (onClear) {
        onClear();
      }
      if (onSearch) {
        onSearch('');
      }
    };

    return (
      <Input
        ref={ref}
        type="search"
        leftIcon="fa-search"
        rightIcon={showClearButton && searchValue ? "fa-times" : undefined}
        onRightIconClick={showClearButton && searchValue ? handleClear : undefined}
        value={searchValue}
        onChange={handleChange}
        {...props}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';

export { Input };