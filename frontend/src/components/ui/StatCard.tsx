import { ReactNode } from 'react';
import Card from './Card';

export interface StatCardProps {
  title: string;
  value: string | number;
  status?: 'success' | 'warning' | 'error' | 'info';
  icon?: ReactNode;
}

const StatCard = ({ title, value, status = 'info', icon }: StatCardProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {title}
          </div>
          <div className={`text-2xl font-bold ${getStatusColor()}`}>
            {value}
          </div>
        </div>
        {icon && (
          <div className={`${getStatusColor()} opacity-80`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard; 