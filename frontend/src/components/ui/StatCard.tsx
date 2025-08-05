import { ReactNode } from 'react';
import Card from './Card';

export interface StatCardProps {
  title: string;
  value: string | number;
  status?: 'success' | 'warning' | 'error' | 'info';
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard = ({ title, value, status = 'info', icon, trend }: StatCardProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return {
          text: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          icon: 'text-green-600 dark:text-green-400'
        };
      case 'warning':
        return {
          text: 'text-yellow-600 dark:text-yellow-400',
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          icon: 'text-yellow-600 dark:text-yellow-400'
        };
      case 'error':
        return {
          text: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          icon: 'text-red-600 dark:text-red-400'
        };
      default:
        return {
          text: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          icon: 'text-blue-600 dark:text-blue-400'
        };
    }
  };

  const colors = getStatusColor();

  return (
    <Card className={`p-6 hover:shadow-lg transition-all duration-300 border-l-4 ${colors.border} ${colors.bg}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            {title}
          </div>
          <div className={`text-3xl font-bold ${colors.text} mb-1`}>
            {value}
          </div>
          {trend && (
            <div className="flex items-center text-xs">
              <span className={`font-medium ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <svg 
                className={`w-3 h-3 ml-1 ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                {trend.isPositive ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                )}
              </svg>
              <span className="text-gray-500 dark:text-gray-400 ml-1">from last month</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`${colors.icon} opacity-80 p-3 rounded-full bg-white dark:bg-neutral-800 shadow-sm`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard; 