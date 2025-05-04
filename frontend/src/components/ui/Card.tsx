import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'hover' | 'interactive';
  padding?: 'none' | 'small' | 'normal' | 'large';
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  variant = 'default',
  padding = 'normal'
}) => {
  const baseStyles = 'rounded-xl bg-background-primary shadow-soft dark:bg-neutral-800 transition-all duration-200';
  
  const variantStyles = {
    default: 'border border-neutral-200 dark:border-neutral-700',
    hover: `border border-neutral-200 dark:border-neutral-700 
      hover:shadow-medium hover:border-primary-200 dark:hover:border-primary-600
      hover:bg-primary-50/50 dark:hover:bg-primary-900/10`,
    interactive: `border border-neutral-200 dark:border-neutral-700 
      hover:shadow-medium hover:border-primary-200 dark:hover:border-primary-600
      hover:bg-primary-50/50 dark:hover:bg-primary-900/10
      cursor-pointer transform hover:-translate-y-1 active:translate-y-0`
  };

  const paddingStyles = {
    none: '',
    small: 'p-3',
    normal: 'p-4 sm:p-6',
    large: 'p-6 sm:p-8'
  };

  return (
    <div
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
};

export default Card; 