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
      
      <div className="flex items-end justify-between h-full space-x-2" style={{ height: `${height}px` }}>
        {data.map((value, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div 
              className={`w-full rounded-t-md ${barColor} hover:opacity-80 transition-all group relative`} 
              style={{ height: `${(value / maxValue) * 100}%` }}
            >
              {/* Tooltip on hover */}
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {value}
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 text-center truncate w-full">
              {labels[index]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleBarChart; 