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

// Card sub-components for Shadcn compatibility
interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
      {children}
    </div>
  );
};

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

const CardTitle: React.FC<CardTitleProps> = ({ children, className = '' }) => {
  return (
    <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>
      {children}
    </h3>
  );
};

interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}

const CardDescription: React.FC<CardDescriptionProps> = ({ children, className = '' }) => {
  return (
    <p className={`text-sm text-muted-foreground ${className}`}>
      {children}
    </p>
  );
};

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  return (
    <div className={`p-6 pt-0 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
export { CardHeader, CardTitle, CardDescription, CardContent }; 