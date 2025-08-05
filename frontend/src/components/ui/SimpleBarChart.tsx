import React from 'react';

interface SimpleBarChartProps {
  data: number[];
  labels: string[];
  height?: number;
  barColor?: string;
  className?: string;
  title?: string;
  subtitle?: string;
}

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({
  data,
  labels,
  height = 200,
  barColor = 'bg-primary-500',
  className = '',
  title,
  subtitle
}) => {
  // Debug logging
  console.log('SimpleBarChart received:', { data, labels, maxValue: Math.max(...data, 1) });
  
  // Handle empty data
  if (!data || data.length === 0 || !labels || labels.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        {(title || subtitle) && (
          <div className="mb-4">
            {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
          </div>
        )}
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm">No data available</p>
            <p className="text-xs text-gray-400">Collection data will appear here once payments are made</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Find the maximum value to scale the bars properly
  const maxValue = Math.max(...data, 1);

  return (
    <div className={`w-full ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
        </div>
      )}
      
      <div className="relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 pr-2">
          {[100, 75, 50, 25, 0].map((percent) => (
            <div key={percent} className="flex items-center">
              <span>{Math.round((maxValue * percent) / 100).toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* Chart container */}
        <div className="ml-12">
          <div className="flex items-end justify-between h-full space-x-3" style={{ height: `${height}px` }}>
            {data.map((value, index) => (
              <div key={index} className="flex flex-col items-center flex-1 group">
                {/* Bar with animation */}
                <div className="relative w-full">
                  <div 
                    className={`w-full rounded-t-lg ${barColor} hover:opacity-80 transition-all duration-700 ease-out group-hover:scale-105 shadow-md hover:shadow-lg`}
                    style={{ 
                      height: `${(value / maxValue) * 100}%`,
                      transform: 'scaleY(0)',
                      transformOrigin: 'bottom',
                      animation: `growBar 0.8s ease-out ${index * 100}ms forwards`
                    }}
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-sm rounded-lg py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 shadow-lg">
                      <div className="font-semibold">{formatCurrency(value)}</div>
                      <div className="text-xs text-gray-300">{labels[index]}</div>
                      {/* Tooltip arrow */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                </div>
                
                {/* X-axis label */}
                <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 text-center truncate w-full font-medium">
                  {labels[index]}
                </div>
              </div>
            ))}
          </div>

          {/* Grid lines */}
          <div className="absolute inset-0 ml-12 pointer-events-none">
            {[25, 50, 75].map((percent) => (
              <div
                key={percent}
                className="absolute w-full border-t border-gray-200 dark:border-gray-700"
                style={{ top: `${percent}%` }}
              ></div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes growBar {
          from {
            transform: scaleY(0);
            opacity: 0;
          }
          to {
            transform: scaleY(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

// Helper function to format currency
const formatCurrency = (amount: number) => {
  const safeAmount = isNaN(amount) || amount === null || amount === undefined ? 0 : amount;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(safeAmount);
};

export default SimpleBarChart; 