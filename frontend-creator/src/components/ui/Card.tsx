import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outlined' | 'elevated';
  onClick?: () => void;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  headerAction?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  variant = 'default',
  onClick,
  title,
  subtitle,
  footer,
  headerAction,
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };

  const variantClasses = {
    default: 'bg-white shadow-md',
    outlined: 'bg-white border border-neutral-200',
    elevated: 'bg-white shadow-lg',
  };

  const hasHeader = title || subtitle || headerAction;
  const hasFooter = footer;
  const contentPadding = padding !== 'none' ? paddingClasses[padding] : '';

  return (
    <div 
      className={`card rounded-component ${variantClasses[variant]} ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {hasHeader && (
        <div className={`border-b border-neutral-100 flex justify-between items-center ${paddingClasses[padding]}`}>
          <div>
            {title && <h3 className="text-lg font-medium text-neutral-900 mb-0">{title}</h3>}
            {subtitle && <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      
      <div className={contentPadding}>
        {children}
      </div>
      
      {hasFooter && (
        <div className={`border-t border-neutral-100 ${paddingClasses[padding]}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;