import { ReactNode } from 'react';

interface DividerProps {
  children?: ReactNode;
  className?: string;
}

const Divider: React.FC<DividerProps> = ({ children, className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-neutral-200 dark:border-neutral-700" />
      </div>
      {children && (
        <div className="relative flex justify-center text-sm">
          <span className="px-2 text-text-tertiary dark:text-neutral-400 bg-white dark:bg-neutral-800">
            {children}
          </span>
        </div>
      )}
    </div>
  );
};

export default Divider; 