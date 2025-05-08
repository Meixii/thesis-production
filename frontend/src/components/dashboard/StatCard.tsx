import { ReactNode } from 'react';
import Card from '../ui/Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  status?: 'success' | 'warning' | 'error' | 'info' | 'blue';
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  status = 'info',
  onClick
}) => {
  const statusColors = {
    success: 'text-success-dark dark:text-success-light bg-success-light/10 dark:bg-success-dark/20 ring-success-light/20 dark:ring-success-dark/30',
    warning: 'text-warning-dark dark:text-warning-light bg-warning-light/10 dark:bg-warning-dark/20 ring-warning-light/20 dark:ring-warning-dark/30',
    error: 'text-error-dark dark:text-error-light bg-error-light/10 dark:bg-error-dark/20 ring-error-light/20 dark:ring-error-dark/30',
    info: 'text-primary-600 dark:text-primary-400 bg-primary-100/50 dark:bg-primary-900/20 ring-primary-400/30 dark:ring-primary-700/30',
    blue: 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 ring-blue-300/30 dark:ring-blue-700/30',
  };

  const valueTextColors = {
    success: 'text-success-dark dark:text-success-light',
    warning: 'text-warning-dark dark:text-warning-light',
    error: 'text-error-dark dark:text-error-light',
    info: 'text-primary-600 dark:text-primary-400',
    blue: 'text-blue-700 dark:text-blue-300 font-bold',
  };

  const trendColors = {
    positive: 'text-success-dark dark:text-success-light',
    negative: 'text-error-dark dark:text-error-light'
  };

  return (
    <Card
      variant={onClick ? 'interactive' : 'default'}
      padding="normal"
      className="w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-shadow duration-200"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {title}
          </p>
          <p className={`text-2xl font-bold ${valueTextColors[status] || 'text-neutral-900 dark:text-white'}`}>
            {value}
          </p>
          {trend && (
            <div className="flex items-center space-x-1">
              <span className={`text-sm font-medium ${trend.isPositive ? trendColors.positive : trendColors.negative}`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                vs last week
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-xl ring-1 ${statusColors[status]}`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard; 