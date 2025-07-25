import React from 'react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray' | 'success' | 'error' | 'warning';
  className?: string;
  label?: string;
  showLabel?: boolean;
  variant?: 'spinner' | 'dots' | 'pulse';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
  label = 'Loading',
  showLabel = false,
  variant = 'spinner',
}) => {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const colorClasses = {
    primary: 'text-primary-500',
    secondary: 'text-secondary-200',
    white: 'text-white',
    gray: 'text-gray-500',
    success: 'text-success',
    error: 'text-error',
    warning: 'text-warning',
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className={`flex space-x-1 ${className}`} role="status" aria-label={label}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`${sizeClasses[size]} ${colorClasses[color]} bg-current rounded-full animate-pulse`}
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1.4s',
                }}
              />
            ))}
            <span className="sr-only">{label}</span>
          </div>
        );

      case 'pulse':
        return (
          <div className={`inline-flex ${className}`} role="status" aria-label={label}>
            <div
              className={`${sizeClasses[size]} ${colorClasses[color]} bg-current rounded-full animate-pulse`}
            />
            <span className="sr-only">{label}</span>
          </div>
        );

      case 'spinner':
      default:
        return (
          <div className={`inline-flex ${className}`} role="status" aria-label={label}>
            <svg
              className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="sr-only">{label}</span>
          </div>
        );
    }
  };

  if (showLabel) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {renderSpinner()}
        <span className={`${textSizeClasses[size]} ${colorClasses[color]} font-medium`}>
          {label}
        </span>
      </div>
    );
  }

  return renderSpinner();
};

export default LoadingSpinner;