import React from 'react';

interface DividerProps {
  text?: string;
  className?: string;
}

const Divider: React.FC<DividerProps> = ({
  text,
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-secondary-light"></div>
      </div>
      {text && (
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-background-primary text-text-tertiary">
            {text}
          </span>
        </div>
      )}
    </div>
  );
};

export default Divider; 