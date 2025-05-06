import React from 'react';

interface DataItem {
  value: number;
  label: string;
  color: string;
}

interface SimplePieChartProps {
  data: DataItem[];
  size?: number;
  thickness?: number;
  className?: string;
  title?: string;
  subtitle?: string;
  showLegend?: boolean;
}

const SimplePieChart: React.FC<SimplePieChartProps> = ({
  data,
  size = 200,
  thickness = 40,
  className = '',
  title,
  subtitle,
  showLegend = true
}) => {
  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;

  // Calculate CSS conic gradient
  let cumulativePercentage = 0;
  const gradientStops = data.map((item) => {
    const startPercentage = cumulativePercentage;
    const itemPercentage = (item.value / total) * 100;
    cumulativePercentage += itemPercentage;
    
    return `${item.color} ${startPercentage}% ${cumulativePercentage}%`;
  }).join(', ');

  const conicGradient = `conic-gradient(${gradientStops})`;

  return (
    <div className={`w-full ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
        </div>
      )}
      
      <div className="flex flex-col md:flex-row items-center justify-center gap-6">
        {/* Chart */}
        <div 
          className="relative rounded-full"
          style={{ 
            width: `${size}px`, 
            height: `${size}px`,
            background: conicGradient,
          }}
        >
          {/* Center hole for donut chart */}
          <div 
            className="absolute bg-white dark:bg-neutral-800 rounded-full"
            style={{ 
              top: `${thickness}px`, 
              left: `${thickness}px`, 
              right: `${thickness}px`, 
              bottom: `${thickness}px` 
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center text-center">
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(total)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Total
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="flex flex-col space-y-2 mt-4 md:mt-0">
            {data.map((item, index) => (
              <div key={index} className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-sm mr-2" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <div className="flex-1 text-sm text-gray-600 dark:text-gray-300">{item.label}</div>
                <div className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(item.value)} ({formatPercentage(item.value, total)})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatPercentage = (value: number, total: number) => {
  return `${Math.round((value / total) * 100)}%`;
};

export default SimplePieChart; 