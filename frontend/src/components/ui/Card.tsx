import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  className = ''
}) => {
  return (
    <div className={`max-w-md w-full space-y-8 bg-background-primary p-6 rounded-xl shadow-soft ${className}`}>
      {(title || subtitle) && (
        <div>
          {title && (
            <h2 className="mt-4 text-center text-3xl font-extrabold text-text-primary font-display">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-2 text-center text-sm text-text-tertiary">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card; 