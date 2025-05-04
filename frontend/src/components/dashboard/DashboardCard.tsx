import { ReactNode } from 'react';
import Card from '../ui/Card';

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  noPadding?: boolean;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  subtitle,
  children,
  action,
  className = '',
  noPadding = false
}) => {
  return (
    <Card
      variant="default"
      padding={noPadding ? 'none' : 'normal'}
      className={`w-full ${className}`}
    >
      <div className="flex flex-col space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
          {action && (
            <div className="ml-4">
              {action}
            </div>
          )}
        </div>
        <div className={noPadding ? '' : 'pt-2'}>
          {children}
        </div>
      </div>
    </Card>
  );
};

export default DashboardCard; 