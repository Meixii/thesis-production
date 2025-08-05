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
      
      <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
        {/* Chart */}
        <div className="relative">
          <div 
            className="relative rounded-full shadow-lg hover:shadow-xl transition-shadow duration-300"
            style={{ 
              width: `${size}px`, 
              height: `${size}px`,
              background: conicGradient,
              animation: 'rotateIn 1s ease-out'
            }}
          >
            {/* Center hole for donut chart */}
            <div 
              className="absolute bg-white dark:bg-neutral-800 rounded-full shadow-inner"
              style={{ 
                top: `${thickness}px`, 
                left: `${thickness}px`, 
                right: `${thickness}px`, 
                bottom: `${thickness}px` 
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center text-center">
                <div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(total)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Total Collected
                  </div>
                </div>
              </div>
            </div>

            {/* Hover effects for each segment */}
            {data.map((item, index) => {
              const startAngle = data.slice(0, index).reduce((sum, d) => sum + (d.value / total) * 360, 0);
              const endAngle = startAngle + (item.value / total) * 360;
              
              return (
                <div
                  key={index}
                  className="absolute inset-0 rounded-full opacity-0 hover:opacity-20 transition-opacity duration-200 cursor-pointer"
                  style={{
                    background: `conic-gradient(${item.color} ${startAngle}deg ${endAngle}deg, transparent ${endAngle}deg)`
                  }}
                  title={`${item.label}: ${formatCurrency(item.value)} (${formatPercentage(item.value, total)})`}
                />
              );
            })}
          </div>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="flex flex-col space-y-3 min-w-0">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Payment Methods</h4>
            {data.map((item, index) => (
              <div key={index} className="flex items-center group">
                <div 
                  className="w-4 h-4 rounded-sm mr-3 shadow-sm group-hover:scale-110 transition-transform duration-200" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {item.label}
                  </div>
                </div>
                <div className="ml-3 text-right">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatCurrency(item.value)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatPercentage(item.value, total)}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Summary */}
            <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes rotateIn {
          from {
            transform: rotate(-180deg) scale(0.8);
            opacity: 0;
          }
          to {
            transform: rotate(0deg) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

// Helper functions
const formatCurrency = (amount: number) => {
  // Handle NaN, null, undefined values
  const safeAmount = isNaN(amount) || amount === null || amount === undefined ? 0 : amount;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(safeAmount);
};

const formatPercentage = (value: number, total: number) => {
  return `${Math.round((value / total) * 100)}%`;
};

export default SimplePieChart; 